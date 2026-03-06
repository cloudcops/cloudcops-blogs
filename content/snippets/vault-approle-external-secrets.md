---
title: "HashiCorp Vault AppRole for External Secrets Operator"
description: "Set up a Vault AppRole with non-expiring secret IDs for the External Secrets Operator on Kubernetes."
date: "2026-01-28"
tags: [vault, kubernetes, secrets, security]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## The Problem

External Secrets Operator needs a way to authenticate with Vault that doesn't expire and doesn't require human intervention. AppRole is the recommended auth method for machine-to-machine authentication.

## Setup

Enable AppRole auth and create a role with a long-lived secret ID:

```bash
# Enable AppRole auth method
vault auth enable approle

# Set long default TTLs for the AppRole mount
vault auth tune -default-lease-ttl=999999999 -max-lease-ttl=999999999 approle

# Create the role with appropriate token settings
vault write auth/approle/role/external-secrets-operator \
  secret_id_ttl=999999999 \
  secret_id_num_uses=999999999

vault write auth/approle/role/external-secrets-operator \
  token_num_uses=20 \
  token_ttl=20m \
  token_max_ttl=30m \
  token_explicit_max_ttl=30m

# Generate the secret ID
vault write -f auth/approle/role/external-secrets-operator/secret-id

# Get the role ID
vault read auth/approle/role/external-secrets-operator/role-id

# Assign policies
vault write -f auth/approle/role/external-secrets-operator policies=admin
```

## Test the Login

```bash
vault write auth/approle/login \
  role_id=<your-role-id> \
  secret_id=<your-secret-id>
```

## Kubernetes Secret Store

Create the `ClusterSecretStore` pointing to Vault:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: vault-secret-store
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        appRole:
          path: "approle"
          roleRef:
            name: vault-approle
            key: role-id
            namespace: external-secrets
          secretRef:
            name: vault-approle
            key: secret-id
            namespace: external-secrets
```

## Gotcha

The `token_num_uses=20` means each token can only be used 20 times before ESO needs to re-authenticate. If you have many secrets syncing frequently, increase this value or set it to `0` (unlimited). Watch for `403 permission denied` errors in ESO logs as a sign the token is exhausted.
