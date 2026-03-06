---
title: "Zalando Postgres Operator: Backup & Restore on Azure"
description: "Complete guide to setting up WAL-G backups with Azure Blob Storage for the Zalando Postgres Operator, including restore procedures and troubleshooting."
date: "2026-02-10"
tags: [kubernetes, postgresql, azure, backups, zalando]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## Accessing the Database

The operator creates a service automatically at `cluster-name.postgres-operator.svc.cluster.local:5432`. Set up users via the `postgresql` resource:

```yaml
spec:
  preparedDatabases:
    db_name:
      defaultUsers: true
```

This creates owner, reader, and writer users with credentials stored as secrets in the `postgres-operator` namespace. The admin secret is named `postgres.cluster-name.credentials.postgresql.acid.zalan.do`.

## Setting Up Backups

### 1. ConfigMap for WAL-G

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pod-env-overrides
  namespace: postgres-operator
data:
  USE_WALG_BACKUP: "true"
  USE_WALG_RESTORE: "true"
  WALG_AZ_PREFIX: "azure://container-name/$(SCOPE)/$(PGVERSION)"
  BACKUP_SCHEDULE: "00 03 * * *"
  CLONE_USE_WALG_BACKUP: "true"
  CLONE_USE_WALG_RESTORE: "true"
  CLONE_WALG_AZ_PREFIX: "azure://container-name/$(SCOPE)/$(PGVERSION)"
```

Replace `container-name` with your Azure Storage container name. The `CLONE_*` prefixed values are only needed for restoring backups.

### 2. Azure Storage Account Key

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: psql-backup-creds
  namespace: postgres-operator
spec:
  refreshInterval: 1m
  secretStoreRef:
    name: azure-secret-store
    kind: ClusterSecretStore
  data:
    - secretKey: AZURE_STORAGE_ACCESS_KEY
      remoteRef:
        key: psql-backup-access-key
    - secretKey: CLONE_AZURE_STORAGE_ACCESS_KEY
      remoteRef:
        key: psql-backup-access-key
```

### 3. Operator Helm Parameters

```yaml
spec:
  source:
    chart: postgres-operator
    repoURL: https://opensource.zalando.com/postgres-operator/charts/postgres-operator
    targetRevision: 1.12.2
    helm:
      parameters:
        - name: configAwsOrGcp.wal_az_storage_account
          value: "storage-account-name"
        - name: configKubernetes.pod_environment_configmap
          value: "postgres-operator/pod-env-overrides"
        - name: configKubernetes.pod_environment_secret
          value: "psql-backup-creds"
        - name: configKubernetes.enable_cross_namespace_secret
          value: "true"
```

## Restoring Backups

Create a new `postgresql` resource with the clone block:

```yaml
spec:
  clone:
    cluster: "old-cluster-name"
    timestamp: "2024-12-03T13:41:57+01:00"
```

**Gotcha**: Don't set the `uid` property — in testing, it caused restore failures. Only use `uid` if you have multiple clusters with the same name backed up to the same container.

## Troubleshooting

```bash
# Check operator pod logs
kubectl get pods -n postgres-operator
kubectl logs <cluster-pod-name>-0 -n postgres-operator

# Connect to the database directly
kubectl exec -it <pod-name> -- /bin/bash
su postgres
psql -d dbname
# List tables: \dt data.*
# Explore: SELECT * FROM data.table_name

# List available base backups
kubectl exec -it <pod-name> -- bash -c \
  'envdir "/run/etc/wal-e.d/env" wal-g backup-list --pretty --detail'
```
