---
title: "Resize PVCs Dynamically in Kubernetes"
description: "Expand PersistentVolumeClaim storage on the fly without downtime — check, patch, verify."
date: "2026-01-10"
tags: [kubernetes, storage, pvc, azure]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## Check if StorageClass supports expansion

```bash
kubectl get sc
# Look for ALLOWVOLUMEEXPANSION = true
```

## Check current PVC size

```bash
kubectl get pvc data-loki-write-0 -n logging -o jsonpath='{.spec.resources.requests.storage}'
```

## Patch the PVC to new size

```bash
kubectl patch pvc data-loki-write-0 -n logging \
  -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
```

## Verify

```bash
kubectl get pvc data-loki-write-0 -n logging
# STATUS should stay "Bound", CAPACITY should update
```

## Gotcha

- You can only **increase** size, never shrink
- Azure Disk CSI: online expansion works, no pod restart needed
- If PVC shows `FileSystemResizePending` condition, restart the pod using it
- Some older provisioners require the pod to be deleted so the volume can detach, resize, and reattach
- `allowVolumeExpansion` must be `true` on the StorageClass **before** you try to patch
