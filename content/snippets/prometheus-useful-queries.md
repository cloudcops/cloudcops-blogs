---
title: "Prometheus: Copy-Paste PromQL Queries for Kubernetes"
description: "Ready-to-use PromQL for pod restarts, ArgoCD health, node memory, and CPU load alerts."
date: "2026-01-25"
tags: [prometheus, monitoring, kubernetes, promql]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## Pods restarting or not running

```promql
rate(kube_pod_container_status_restarts_total[5m]) > 0
or
kube_pod_status_phase{phase!="Running", phase!="Succeeded"}
```

## ArgoCD unhealthy apps

```promql
argocd_app_info{health_status!="Healthy"} > 0
```

## ArgoCD out-of-sync apps

```promql
argocd_app_info{sync_status="OutOfSync"} > 0
```

## Node CPU load (15m avg, normalized)

```promql
avg(node_load15) / count(node_cpu_seconds_total{mode="idle"}) > 0.8
```

## Node memory > 85%

```promql
avg(
  (node_memory_MemTotal_bytes - node_memory_MemFree_bytes
   - node_memory_Buffers_bytes - node_memory_Cached_bytes)
  / node_memory_MemTotal_bytes
) > 0.85
```

## Grafana alert rule (Terraform)

```hcl
pods_crashing = {
  name            = "Pod Restarting Alert"
  no_data_state   = "OK"
  condition       = "rate(kube_pod_container_status_restarts_total[5m]) > 0"
  triggered_after = "5m"
  annotations = {
    severity = "critical"
    summary  = "Pod keeps restarting for 5+ minutes"
    todo     = "kubectl logs <pod> -n <ns> --previous"
  }
  labels = {
    team    = "devops"
    send_to = "teams_channel_devops"
  }
}
```

## Gotcha

- Always use a `for` duration (e.g. `5m`) in alert rules — otherwise rolling deployments trigger false alerts
- `node_load15 > 1` is meaningless on multi-core nodes — normalize by CPU count
- The ArgoCD queries require the ArgoCD metrics exporter to be enabled (`server.metrics.enabled: true`)
