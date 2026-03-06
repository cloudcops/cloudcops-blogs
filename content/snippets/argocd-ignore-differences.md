---
title: "ArgoCD ignoreDifferences Patterns"
description: "Copy-paste ignoreDifferences configs for common false OutOfSync issues in ArgoCD."
date: "2026-01-18"
tags: [argocd, gitops, kubernetes, configuration]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## Ignore operator-managed labels

```yaml
spec:
  ignoreDifferences:
    - group: opentelemetry.io
      kind: Instrumentation
      name: otel-java-instrumentation
      jqPathExpressions:
        - .metadata.labels."app.kubernetes.io/instance"
```

## Ignore kubectl restartedAt annotation

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      name: gitlab-controller-manager
      jqPathExpressions:
        - .spec.template.metadata.annotations."kubectl.kubernetes.io/restartedAt"
```

## Ignore revision annotation on all Deployments

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jqPathExpressions:
        - .metadata.annotations."deployment.kubernetes.io/revision"
```

## Ignore all managed fields (useful for CRDs)

```yaml
spec:
  ignoreDifferences:
    - group: "*"
      kind: "*"
      managedFieldsManagers:
        - kube-controller-manager
```

## Cluster-wide default (argocd-cm ConfigMap)

```yaml
data:
  resource.customizations.ignoreDifferences.all: |
    jqPathExpressions:
      - .metadata.managedFields
```

## Gotcha

- Keys with dots/slashes need quotes in jqPathExpressions: `.metadata.labels."app.kubernetes.io/instance"`
- `jsonPointers` alternative uses `~1` for slashes: `/metadata/annotations/kubectl.kubernetes.io~1restartedAt`
- Be specific with `name`, `group`, `kind` — wildcards mask real drift
