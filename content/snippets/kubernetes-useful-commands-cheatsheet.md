---
title: "Kubernetes Useful Commands Cheat Sheet"
description: "Battle-tested kubectl commands for daily cluster operations — pod cleanup, version checks, network debugging, bulk patching, and more."
date: "2026-02-15"
tags: [kubernetes, kubectl, bash, cheatsheet]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## Check All Running Image Versions Across a Cluster

Quickly audit every container image running in your cluster:

```bash
kubectl get deployment -o=jsonpath="{range .items[*]}{'\n'}{.metadata.name}{': '}{range .spec.template.spec.containers[*]}{.image},{end}{end}" -A | sort
```

## Compare Versions Between Two Clusters

Diff deployments across environments to find drift:

```bash
diff --width=300 --suppress-common-lines --side-by-side \
  <(kubectl get deployment --context=cluster-a -o=jsonpath="{range .items[*]}{'\n'}{.metadata.name}{': '}{range .spec.template.spec.containers[*]}{.image},{end}{end}" -A | sort) \
  <(kubectl get deployment --context=cluster-b -o=jsonpath="{range .items[*]}{'\n'}{.metadata.name}{': '}{range .spec.template.spec.containers[*]}{.image},{end}{end}" -A | sort)
```

## Cleanup Dangling Pods

Remove pods stuck in error states across all namespaces:

```bash
# Clean up Error pods
for I in $(kubectl get pods --all-namespaces | grep Error | awk '{print $1 "," $2}'); do
  pod=($(echo "$I" | tr "," " "))
  kubectl -n ${pod[0]} delete pod ${pod[1]}
done

# Clean up ContainerStatusUnknown pods
for I in $(kubectl get pods --all-namespaces | grep ContainerStatusUnknown | awk '{print $1 "," $2}'); do
  pod=($(echo "$I" | tr "," " "))
  kubectl -n ${pod[0]} delete pod ${pod[1]}
done

# Clean up empty ReplicaSets
for I in $(kubectl get rs --all-namespaces | grep "0         0         0" | awk '{print $1 "," $2}'); do
  pod=($(echo "$I" | tr "," " "))
  kubectl -n ${pod[0]} delete rs ${pod[1]}
done
```

## Bulk Patch Deployments in a Namespace

Change an environment variable across all deployments at once:

```bash
kubectl get deployments -o name | sed -e 's/.*\///g' | \
  xargs -I {} kubectl patch deployment {} \
  --type=json -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/env/0/value", "value": "DEBUG"}]'
```

## Delete Secrets in a Loop (Filtered)

Clean up secrets matching a pattern:

```bash
kubectl get secrets -n postgres-operator | grep myapp | awk '{print $1}' | \
  while read secret; do
    kubectl -n postgres-operator delete secret "$secret"
  done
```

## Connect to AKS Node as Root

Debug node-level issues by getting a root shell:

```bash
kubectl debug node/aks-nodepool1-12345678-vmss000000 -it --image=mcr.microsoft.com/cbl-mariner/busybox:2.0
# Then inside the debug container:
chroot /host
```

## Kubeconfig Management

```bash
# List all contexts
kubectl config get-contexts

# Delete a context
kubectl config delete-context my-cluster-context

# List config users
kubectl config view -o jsonpath='{.users[*].name}'

# Delete a user
kubectl config delete-user my-user
```

## Show Node Capacity with Actual Limits

```bash
kubectl top nodes --show-capacity=true
```
