---
title: "ArgoCD GitOps Essentials: Quick Reference"
description: "Core ArgoCD concepts, architecture components, and key features at a glance."
date: "2026-02-01"
tags: [argocd, gitops, kubernetes, deployment]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## CIOps vs GitOps

| | CIOps (Push) | GitOps (Pull) |
|---|---|---|
| **How** | CI pipeline pushes to cluster | ArgoCD watches git, syncs to cluster |
| **Use for** | Dev/test environments | Staging/production |

## Core Concepts

| Concept | What it means |
|---|---|
| **Application** | CRD grouping K8s resources from a manifest |
| **Target state** | What's in Git |
| **Live state** | What's in the cluster |
| **Sync** | Making live = target |
| **Refresh** | Comparing Git vs live |
| **Health** | Is the app actually running and serving? |

## Architecture

- **API Server**: gRPC/REST for Web UI, CLI, CI/CD. Handles auth + RBAC.
- **Repo Server**: Caches git repos, generates manifests from Helm/Kustomize/YAML.
- **App Controller**: Watches running apps, detects `OutOfSync`, runs lifecycle hooks.

## Supported config management

Kustomize, Helm, Jsonnet, plain YAML

## Lifecycle hooks order

`PreSync` → `Sync` → `PostSync` → `SyncFail`

Use for blue/green and canary with **Argo Rollouts**.

## Gotcha

- ArgoCD **does not** handle traffic shifting or canary analysis — pair it with Argo Rollouts for that
- `Healthy` and `Synced` are independent — an app can be synced but unhealthy (e.g. CrashLoopBackOff)
- Refresh interval is 3 minutes by default. For faster detection, configure webhooks (GitHub/GitLab/BitBucket)
