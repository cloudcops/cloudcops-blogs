---
title: "MSSQL Client in Kubernetes: Quick sqlcmd Reference"
description: "Spin up a temporary sqlcmd pod to connect, query, and debug Azure SQL or any MSSQL database from inside your cluster."
date: "2026-01-05"
tags: [kubernetes, mssql, database, azure]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## Spin up a temporary client pod

```bash
kubectl run -i --tty --rm mssql-tools \
  --image=mcr.microsoft.com/mssql-tools \
  --restart=Never -n default -- bash
```

## Connect

```bash
sqlcmd -S <server> -d <database> -U <user> -P '<password>' -N -C
```

## List databases

```bash
sqlcmd -S myserver.database.windows.net \
  -U admin -P 'Pass' \
  -Q "SELECT name FROM sys.databases" -N -C
```

## List tables

```bash
sqlcmd -S myserver.database.windows.net \
  -d MyDB -U admin -P 'Pass' \
  -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'" -N -C
```

## Quick query

```bash
sqlcmd -S myserver.database.windows.net \
  -d MyDB -U admin -P 'Pass' \
  -Q "SELECT TOP 10 * FROM dbo.Users" -N -C
```

## Flags

| Flag | Purpose |
|---|---|
| `-S` | Server name |
| `-d` | Database |
| `-U` / `-P` | Username / Password |
| `-N` | Encrypt connection |
| `-C` | Trust server cert |
| `-Q` | Run query and exit |

## Gotcha

- `-P` on the command line shows up in process lists — omit it and enter interactively in production
- Azure SQL **requires** `-N` (encryption), you'll get a cryptic connection error without it
- If `Login timeout expired`: check firewall rules, private endpoints, and that the pod network can reach the SQL server
- Quote the password with single quotes if it has special chars: `-P 'p@ss!word'`
