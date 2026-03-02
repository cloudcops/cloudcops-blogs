---
title: "Zero-Downtime NGINX Upgrade in GitOps Environment"
description: "Learn how to upgrade NGINX Ingress Controller without service downtime using Kubernetes RollingUpdate"
date: "2025-11-06"
tags: [Kubernetes, GitOps, Helm]
author:
  name: "Sejoon Kim"
  url: "https://www.linkedin.com/in/sejokimde/"
---

## Introduction

At CloudCops, we recently performed a cluster-wide application upgrade for one of our client projects. All applications in the cluster are deployed using GitOps principles, where infrastructure and application states are declared in Git and automatically synchronized to the Kubernetes cluster. During this upgrade process, maintaining zero downtime was critical, particularly for NGINX Ingress Controller, which handles all incoming traffic to the cluster.

This article describes our approach to upgrading NGINX without service interruption, using the Kubernetes RollingUpdate strategy with specific configuration parameters.


## Why Zero Downtime Matters

NGINX Ingress Controller is a critical component that routes all external traffic to services within the cluster. Any downtime in NGINX directly translates to service unavailability for end users. In production environments, this means:

- Revenue loss from unavailable services
- Degraded user experience and trust
- Violation of SLA agreements with clients
- Potential data loss from interrupted transactions

For our client, maintaining continuous availability was non-negotiable. Even a few seconds of downtime could impact their business operations and user satisfaction.


## Understanding Kubernetes RollingUpdate

Kubernetes provides several deployment strategies, with RollingUpdate being the default. However, the default configuration does not guarantee zero downtime for all scenarios. Understanding how RollingUpdate works is essential to configure it correctly.


### Default RollingUpdate Behavior

By default, Kubernetes uses these values:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%
    maxUnavailable: 25%
```

During an update, Kubernetes will:

1. Create new pods with the updated version
2. Terminate old pods as new ones become ready
3. Allow up to 25% more pods than desired (maxSurge)
4. Allow up to 25% of pods to be unavailable (maxUnavailable)

The problem with default settings is that maxUnavailable: 25% permits pod termination before new pods are fully ready to handle traffic. For NGINX handling active connections, this can cause:

- Connection drops during pod termination
- Brief periods where insufficient capacity exists
- Failed health checks if pods terminate too quickly


## The Solution: Optimized RollingUpdate Configuration

We modified the NGINX Helm chart values to use the following RollingUpdate configuration:

```yaml
updateStrategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
minReadySeconds: 10
```


### Why These Values Work

**maxSurge: 1**

This parameter controls how many additional pods can be created above the desired replica count during the update.

Setting maxSurge to 1 means Kubernetes will create one extra pod beyond the desired count. For example, if you have 3 NGINX replicas, Kubernetes will temporarily run 4 pods during the upgrade.

Benefits:
- New version pods start receiving traffic before any old pods terminate
- Smooth transition without capacity reduction
- Load is gradually shifted to new pods

**maxUnavailable: 0**

This is the critical parameter for zero downtime. It ensures that no pod is terminated until a replacement is ready and healthy.

With maxUnavailable: 0, Kubernetes guarantees:
- All desired replicas remain available throughout the upgrade
- Old pods continue serving traffic until new pods pass health checks
- No capacity reduction at any point during rollout

The upgrade process becomes:
1. Create one new pod (allowed by maxSurge: 1)
2. Wait for new pod to become ready and pass health checks
3. Terminate one old pod
4. Repeat until all pods are updated

**minReadySeconds: 10**

This parameter defines how long a pod must be ready without any issues before it is considered available.

Setting minReadySeconds to 10 means Kubernetes waits 10 seconds after a pod passes readiness checks before considering it fully available and proceeding with the next pod.

Benefits:
- Catches issues that appear shortly after pod starts
- Prevents premature termination of old pods
- Allows NGINX to fully initialize and register with load balancers
- Provides buffer time for configuration loading and validation


### How the Upgrade Process Works

With these settings, the upgrade sequence for a 3-replica NGINX deployment is:

**Step 1**: Initial state has 3 old version pods running

**Step 2**: Kubernetes creates 1 new version pod (total: 4 pods running)

**Step 3**: New pod starts and begins initialization

**Step 4**: New pod passes readiness probe

**Step 5**: Wait 10 seconds (minReadySeconds)

**Step 6**: New pod is now considered available

**Step 7**: Kubernetes terminates 1 old pod (back to 3 pods: 2 old, 1 new)

**Step 8**: Repeat steps 2-7 until all pods are updated

At every moment during this process, at least 3 healthy pods are running and serving traffic. There is no capacity reduction or service interruption.


## Implementation in Helm Chart

Here is the configuration we added to the NGINX Helm values file:

```yaml
controller:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  minReadySeconds: 10
```

This simple configuration change was all that was needed to achieve zero-downtime upgrades. We did not need to modify health check probes, lifecycle hooks, or other advanced settings. The NGINX Helm chart's default values for these were sufficient.


## GitOps Workflow

The upgrade process in our GitOps environment:

**Step 1**: Update NGINX version in Helm values file

```yaml
controller:
  image:
    registry: registry.k8s.io
    image: ingress-nginx/controller
    tag: "v1.9.0"
```


**Step 2**: Commit changes to Git repository

```bash
git add nginx-ingress/values.yaml
git commit -m "chore: upgrade NGINX ingress controller to v1.9.0"
git push origin main
```


**Step 3**: ArgoCD detects the change

ArgoCD automatically synchronizes the change to the cluster based on the configured sync policy.


**Step 4**: Kubernetes applies the RollingUpdate

With our configured parameters, Kubernetes performs the zero-downtime rollout automatically.


**Step 5**: Monitor the rollout

```bash
# Watch pod status during rollout
kubectl get pods -n ingress-nginx -w

# Check rollout status
kubectl rollout status deployment/nginx-ingress-controller -n ingress-nginx
```

**Step 6**: Verify successful upgrade

```bash
# Check running version
kubectl get pods -n ingress-nginx -o jsonpath='{.items[0].spec.containers[0].image}'

# Verify all pods are ready
kubectl get deployment nginx-ingress-controller -n ingress-nginx
```


## Monitoring During Upgrade

We monitored these metrics during the upgrade to verify zero downtime:

**Connection Metrics**
- Active connections per pod
- Connection establishment rate
- Connection errors or refused connections

**Response Metrics**
- HTTP status code distribution (looking for 502/503 errors)
- Response latency percentiles
- Request success rate

**Pod Status**
- Pod readiness transitions
- Container restart count
- Time spent in each rollout step

In our case, all metrics remained stable throughout the upgrade, confirming true zero downtime.


## Key Takeaways

1. **maxUnavailable: 0 is critical** for zero-downtime deployments. It ensures capacity is never reduced during upgrades.

2. **maxSurge: 1 provides a smooth transition** by allowing new pods to start before old ones terminate.

3. **minReadySeconds adds a safety buffer** to catch issues that appear shortly after pod startup.

4. **GitOps workflow with ArgoCD enables safe, auditable upgrades** with full rollback capability through Git.


## Conclusion

Achieving zero-downtime NGINX upgrades in a GitOps environment is straightforward with proper RollingUpdate configuration. The key is ensuring that Kubernetes never reduces available capacity during the rollout process.

By setting maxUnavailable to 0, maxSurge to 1, and adding a minReadySeconds buffer, we successfully upgraded NGINX across our client's cluster without any service interruption. This approach works reliably and requires no complex orchestration or manual intervention.

The combination of Kubernetes RollingUpdate strategy with an ArgoCD-based GitOps workflow provides a robust foundation for maintaining high availability during infrastructure upgrades.