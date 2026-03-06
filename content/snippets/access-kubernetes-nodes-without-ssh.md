---
title: "Access Kubernetes Nodes Without SSH"
description: "Get a root shell on K8s nodes when SSH is blocked — kubectl debug, nsenter, and systemctl access."
date: "2026-02-05"
tags: [kubernetes, debugging, security, nodes]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## Quick: kubectl debug

```bash
kubectl debug node/<node-name> -it \
  --image=mcr.microsoft.com/cbl-mariner/busybox:2.0

# Inside the container:
chroot /host
```

## Full access: privileged pod + nsenter

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: node-shell
spec:
  hostPID: true
  containers:
  - name: shell
    image: ubuntu
    command: ["sleep", "3600"]
    securityContext:
      privileged: true
    volumeMounts:
    - mountPath: /run/dbus/system_bus_socket
      name: dbus-socket
    - mountPath: /run/systemd/system
      name: systemd-socket
  volumes:
  - name: dbus-socket
    hostPath:
      path: /run/dbus/system_bus_socket
      type: Socket
  - name: systemd-socket
    hostPath:
      path: /run/systemd/system
      type: Directory
```

```bash
kubectl apply -f node-shell.yaml
kubectl exec -it node-shell -- bash

# Enter node namespace
nsenter --target 1 --mount --uts --ipc --net --pid /bin/bash

# Now you have full node access:
systemctl status kubelet
journalctl -u kubelet --no-pager -n 50
df -h
crictl ps
```

## nsenter flags

| Flag | Does |
|---|---|
| `--target 1` | PID 1 (systemd) namespace |
| `--mount` | Node filesystem |
| `--net` | Node network |
| `--pid` | Node processes |

## Gotcha

- **Delete the pod immediately after**: `kubectl delete pod node-shell`
- `privileged: true` + `hostPID: true` = full root on the node
- On GKE Autopilot, privileged pods are blocked by policy
- `kubectl debug node/` doesn't give you systemctl — use the privileged pod method if you need daemon control
