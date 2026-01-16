---
title: "Implementing CrowdSec WAF on Kubernetes: A Practical Guide"
description: "How we implemented an open-source WAF solution for protecting public APIs, including PostgreSQL integration and troubleshooting real-world challenges"
date: "2026-01-14"
tags: [Kubernetes, Security, WAF, CrowdSec, PostgreSQL]
author:
  name: "Sejoon Kim"
  url: "https://www.linkedin.com/in/sejokimde/"
---

## Background

During an internal project, we encountered a situation where certain APIs needed to be accessible without authentication. This created a security concern - public endpoints are inherently vulnerable to various attacks including SQL injection, brute force attempts, and scanner reconnaissance.

We needed a WAF (Web Application Firewall) solution. After evaluating options, we chose CrowdSec, an open-source security stack that provides collaborative threat intelligence and WAF capabilities at no licensing cost.

This article documents our implementation journey, the challenges we faced, and how we resolved them.


## Why CrowdSec

| Aspect | Traditional WAF (CloudFlare, AWS WAF) | CrowdSec |
|--------|---------------------------------------|----------|
| Cost | Expensive (per-request pricing) | Free (open-source) |
| Architecture | Monolithic | Distributed (Detection + Enforcement) |
| Intelligence | Static rules | Community-powered threat feeds |
| Vendor Lock-in | High | None |

The distributed architecture was particularly appealing. CrowdSec separates detection (Agent analyzing logs) from enforcement (Bouncer blocking traffic), allowing each component to scale independently.


## Architecture Overview

Our target environment was a Kubernetes cluster running on Hetzner Cloud with the following traffic flow:

```
Client → Hetzner Load Balancer → NGINX Ingress → Application Pods
```

We deployed CrowdSec with these components:

- **LAPI (Local API)**: The central brain. Stores ban decisions in PostgreSQL, provides API for bouncers to query, and syncs with CrowdSec's community threat intelligence.
- **Agent**: The detective. Reads logs (from Loki in our case), parses them using installed parsers, detects attack patterns, and reports malicious IPs to LAPI.
- **AppSec**: The real-time inspector. Analyzes HTTP request payloads for attacks like SQL injection and XSS before they reach the application.
- **Bouncer (Lua plugin)**: The security guard. Integrated into NGINX, checks every incoming request against LAPI's ban list and enforces blocking decisions.

![CrowdSec Architecture](/images/crowdsec-architecture.png)

When a request arrives, the Lua Bouncer checks with LAPI whether the source IP is banned. Simultaneously, AppSec analyzes the request payload for malicious patterns. If either check fails, the request is blocked with a 403 response.

![Normal Request Flow](/images/crowdsec-normal-request.png)

![Blocked Attack Flow](/images/crowdsec-blocked-attack.png)


## Implementation Challenges

### Challenge 1: PostgreSQL Cluster Creation Failure

CrowdSec's official documentation recommends using PostgreSQL for production deployments instead of the default SQLite. We used Zalando's postgres-operator to provision a lightweight PostgreSQL cluster.

**The Problem**

When we created the PostgreSQL CR (Custom Resource) in the `crowdsec` namespace, the StatefulSet was never created. The operator logs showed:

```
{"cluster-name":"crowdsec/crowdsec-postgres","level":"info","msg":"pod disruption budget ... created"}
{"cluster-name":"crowdsec/crowdsec-postgres","level":"warning","msg":"defined CPU limit 0 for postgres container is below required minimum"}
```

After this warning, nothing happened. No StatefulSet, no pods.

**What We Tried**

1. Restarting the postgres-operator pod - no effect
2. Adding explicit resource limits - no effect
3. Adding various optional fields (spiloFSGroup, allowedSourceRanges) - no effect

**The Solution**

We moved the PostgreSQL cluster to the `postgres-operator` namespace instead of `crowdsec`. The StatefulSet was created immediately.

```yaml
apiVersion: "acid.zalan.do/v1"
kind: postgresql
metadata:
  name: crowdsec-postgres
  namespace: postgres-operator  # Changed from crowdsec
spec:
  preparedDatabases:
    crowdsec:
      defaultUsers: true
      secretNamespace: crowdsec  # Credentials still created in crowdsec namespace
```

The `secretNamespace` field ensures the database credentials are created in the `crowdsec` namespace where LAPI can access them.

The root cause remains unclear - possibly a namespace-specific permission issue with the operator. But moving to the operator's namespace resolved it completely.


### Challenge 2: Client IP Not Reaching CrowdSec

After deployment, we ran penetration tests and noticed something wrong in the CrowdSec Console. All detected attacks showed a private IP address - the Hetzner Load Balancer's internal IP, not the actual client IP.

**The Problem**

CrowdSec was banning the load balancer's internal IP instead of the real attacker IPs. This rendered the WAF ineffective.

**Investigation**

Our setup used PROXY Protocol to preserve client IPs through the load balancer:

```yaml
controller:
  config:
    use-proxy-protocol: "true"
  service:
    annotations:
      load-balancer.hetzner.cloud/uses-proxyprotocol: "true"
```

PROXY Protocol was correctly configured, yet the wrong IP appeared in logs.

**The Root Cause**

We had `use-forwarded-headers: "true"` in our NGINX configuration. This setting tells NGINX to trust X-Forwarded-For headers.

The problem: Hetzner's Load Balancer was setting X-Forwarded-For to its own internal IP. When both PROXY Protocol and use-forwarded-headers are enabled, NGINX prioritizes X-Forwarded-For over PROXY Protocol.

**The Fix**

Remove `use-forwarded-headers` from the configuration. PROXY Protocol alone is sufficient for preserving client IPs:

```yaml
controller:
  config:
    use-proxy-protocol: "true"
    compute-full-forwarded-for: "true"
    # use-forwarded-headers removed
```

After this change, actual client IPs appeared correctly in logs and CrowdSec Console.


### Challenge 3: Agent Log Collection Not Working

The default CrowdSec Agent deployment uses DaemonSet with hostPath mounts to read container logs directly from nodes. This approach failed in our environment.

**The Problem**

Agent pods started successfully but collected zero logs. The acquisition configuration used wildcard patterns:

```yaml
acquisition:
  - namespace: nginx-public
    podName: "ingress-nginx-controller-*"
    program: nginx
```

However, containerd stores logs in paths like `/var/log/pods/<namespace>_<pod-name>_<uid>/<container>/`. The dynamic UID component made pattern matching unreliable.

**The Solution**

We already had Loki collecting logs from all pods. Instead of fighting with hostPath mounts, we switched the Agent to use Loki as its datasource:

```yaml
agent:
  isDeployment: true    # Changed from DaemonSet
  hostVarLog: false     # Disable hostPath mount
  
  additionalAcquisition:
    - source: loki
      url: "http://loki-distributed-query-frontend.monitoring:3100"
      query: '{namespace="nginx-public", container="controller"}'
      labels:
        type: nginx
        program: nginx
```

**Benefits of This Approach**

| Metric | DaemonSet (Before) | Deployment + Loki (After) |
|--------|-------------------|---------------------------|
| Pod Count | 1 per node (3 total) | 1 fixed | 
| CPU Request | 500m x 3 = 1500m | 500m |
| Memory Request | 250Mi x 3 = 750Mi | 250Mi |

This change reduced resource consumption by 67% while improving reliability. Loki already aggregates logs from all nodes, so the Agent can analyze everything from a single Deployment.


## PostgreSQL Integration

Following CrowdSec's production recommendations, we configured LAPI to use PostgreSQL:

```yaml
config:
  config.yaml.local: |
    db_config:
      type: postgresql
      user: crowdsec_owner_user
      password: "${DB_PASSWORD}"
      db_name: crowdsec
      host: crowdsec-postgres.postgres-operator.svc.cluster.local
      port: 5432
      sslmode: require
```

The password is injected from a Kubernetes Secret created by postgres-operator. With PostgreSQL backend, LAPI can share decision data across restarts and enables horizontal scaling when needed.

One caveat: after switching from SQLite to PostgreSQL, existing machines and bouncers need to re-register. With `auto_registration` enabled, restarting the Agent and AppSec pods handles this automatically.


## Verification: Penetration Testing

After resolving all integration challenges, we ran penetration tests to verify the WAF was working correctly.

The security team simulated various attack patterns - SQL injection attempts, directory traversal, and scanner tool signatures. This time, the CrowdSec Console showed the actual attacker IPs being detected and banned.

We confirmed that:
- Attack requests were blocked with 403 responses
- Attacker IPs appeared in LAPI's decision list
- Subsequent requests from banned IPs were rejected immediately
- The ban decisions synced to CrowdSec's community blocklist

The WAF was now functioning as intended.


## Results

**Detection Capabilities**
- SQL injection attempts blocked
- Scanner tools (sqlmap, nikto) detected and banned
- Brute force login attempts throttled
- OWASP Top 10 attack patterns covered via AppSec rules

**Operational Benefits**
- Sub-millisecond decision latency (Lua cache)
- Centralized visibility via CrowdSec Console
- Prometheus metrics for monitoring
- Zero licensing cost


## Key Takeaways

1. **Zalando postgres-operator may have namespace restrictions**. When StatefulSet creation silently fails, try deploying in the `postgres-operator` namespace with `secretNamespace` pointing to your target namespace.

2. **PROXY Protocol and X-Forwarded-For can conflict**. When using PROXY Protocol with cloud load balancers, avoid `use-forwarded-headers: true` - the load balancer's internal IP may override the real client IP.

3. **Loki datasource is simpler than hostPath mounts**. If you already have centralized logging, use it as Agent's datasource instead of wrestling with container log paths and permissions.

4. **PostgreSQL is recommended for production**. SQLite works for testing, but PostgreSQL enables persistent decision storage and horizontal scaling when needed.


## Conclusion

Implementing CrowdSec on Kubernetes required solving several integration challenges specific to our infrastructure. The PostgreSQL namespace issue, client IP preservation through load balancers, and log collection mechanism each required investigation and non-obvious solutions.

The end result is a fully functional WAF protecting our public APIs at zero licensing cost. The community threat intelligence and real-time AppSec analysis provide defense-in-depth that would otherwise require expensive commercial solutions.

For teams considering CrowdSec, the distributed architecture is both its strength and complexity. Plan for integration challenges with your specific infrastructure, and the troubleshooting documented here may save you time.


## References

- [CrowdSec Official Documentation](https://docs.crowdsec.net/)
- [CrowdSec Helm Chart](https://github.com/crowdsecurity/helm-charts)
- [Ingress NGINX CrowdSec Bouncer Guide](https://docs.crowdsec.net/u/bouncers/ingress-nginx/)
- [CrowdSec AppSec QuickStart](https://docs.crowdsec.net/docs/appsec/quickstart/)
- [Zalando Postgres Operator](https://postgres-operator.readthedocs.io/)
- [NGINX Ingress Controller ConfigMap](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/)
- [Hetzner Load Balancer PROXY Protocol](https://docs.hetzner.cloud/cloud/load-balancers/overview/#proxy-protocol)
