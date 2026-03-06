---
title: "Kubernetes Resource Limits: No CPU Limits, Memory Limit = Request"
description: "The correct way to set Kubernetes resource requests and limits — from the K8s maintainers at Google."
date: "2026-01-15"
tags: [kubernetes, resources, best-practices, performance]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## The Rule (Tim Hockin, K8s maintainer at Google)

- **Memory**: `limits = requests` (always)
- **CPU**: **Never** set CPU limits

## The Config

```yaml
# Correct
resources:
  requests:
    cpu: 500m
    memory: 256Mi
  limits:
    memory: 256Mi  # equals request, no CPU limit

# Wrong - causes unnecessary CPU throttling
resources:
  requests:
    cpu: 500m
    memory: 256Mi
  limits:
    cpu: 1000m     # remove this
    memory: 512Mi  # should equal request
```

## Why

- **CPU limits** cause CFS throttling even when the node has spare CPU. Your pod gets slower for no reason.
- **Memory limit > request** = node overcommit. The kernel OOM killer starts randomly evicting pods under pressure.

## Check for existing LimitRanges that might override

```bash
kubectl get limitrange -A
```

## Gotcha

- VPA (Vertical Pod Autoscaler) sets CPU limits by default in some versions — check the `updatePolicy`
- If a namespace has a `LimitRange` with `defaultLimit` for CPU, every pod without explicit limits gets one forced on it
- GKE Autopilot ignores your settings and enforces its own limits
