---
title: "How We Migrated Apache Kafka from VMs to Kubernetes (AKS)"
description: "Lessons from migrating a production Kafka cluster, 60+ Elixir microservices, and an entire Ansible-managed infrastructure to Azure Kubernetes Service — including the five things that nearly derailed us."
date: "2026-02-16"
tags: [Kubernetes, Kafka, AKS, Migration, Terraform, ArgoCD, GitOps, DevOps]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salihkayiplar/"
image: "/images/kafka-migration-cover.png"
---

## Background

Migrating Apache Kafka from Virtual Machines to Kubernetes sounds straightforward on paper. In practice, it's one of the most complex infrastructure transformations an enterprise team can undertake.

Over the course of several months, we migrated a production Kafka cluster — along with 60+ Elixir microservices, NGINX reverse proxies, and an entire Ansible-managed infrastructure — into Azure Kubernetes Service (AKS). The project touched every layer of the stack: networking, security, secrets management, observability, and deployment workflows.

This article covers what we did, why we made the decisions we did, and the five things that nearly derailed us.


## The Starting Point: Legacy VM Architecture

The existing setup was a common pattern for organizations that adopted Kafka early:

Kafka brokers ran on dedicated VMs, each paired with a Zookeeper instance. A separate 3-node Zookeeper quorum handled cluster coordination. NGINX ran on its own VM as a reverse proxy with static routing and manual TLS certificate management. Everything was provisioned and configured via Ansible playbooks.

This setup worked — until it didn't. The pain points had accumulated over years:

- Manual scaling with no auto-recovery
- Ansible configuration drift across environments
- Secrets stored in configuration files
- No centralized observability
- Growing VM patching burden
- Significant inconsistency between development, staging, and production environments

The organization needed a Kubernetes-native architecture that would eliminate operational overhead while improving security and reliability.


## The Target: Kubernetes-Native Architecture on AKS

Our target architecture was designed around five principles: everything declarative, everything automated, everything observable, everything secure, and everything reproducible.

**Infrastructure Layer:** Terraform and Terragrunt modules provisioned the entire Azure environment — AKS clusters, networking, Key Vault, storage, and monitoring resources. Every infrastructure change went through pull requests and was applied via CI/CD pipelines.

**GitOps Deployment:** ArgoCD became the single deployment mechanism. No engineer needed kubectl access to production. Application manifests lived in Git, and ArgoCD maintained continuous synchronization between the desired state and the live environment.

**Kafka on KRaft:** We migrated from Kafka 2.x with Zookeeper to Kafka 3.x with KRaft — Kafka's built-in consensus mechanism that eliminates the Zookeeper dependency entirely. This reduced the operational surface area significantly: fewer components to manage, fewer failure modes, and a simpler scaling model.

**Zero-Trust Networking:** LinkerD provided a service mesh with mutual TLS (mTLS) between all services. Combined with OPA Gatekeeper for policy enforcement and RBAC-Manager for fine-grained access control, we achieved a zero-trust security posture.

**Observability:** Prometheus, Grafana, and Alertmanager provided metrics and alerting. Custom dashboards were built for Kafka-specific metrics — consumer lag, partition distribution, broker health — giving the operations team visibility they never had on VMs.


## The Five Things That Nearly Derailed Us

### 1. Containerizing Elixir Is Not Trivial

Elixir runs on the BEAM virtual machine, which has its own clustering and node discovery mechanism. In a VM world, nodes find each other via static IP addresses or DNS entries. In Kubernetes, pods are ephemeral — IPs change, containers restart, and scaling happens dynamically.

We had to implement Kubernetes-native service discovery for BEAM clustering, which meant custom libcluster configurations and building GitHub Actions workflows specifically for the Elixir/Phoenix ecosystem. Off-the-shelf Docker images and CI templates didn't exist for our use case.

### 2. Kafka Migration Requires MirrorMaker2

You can't just "move" a Kafka cluster. Kafka stores data, and that data has consumers with offsets, topics with specific partition configurations, and retention policies that matter.

We used MirrorMaker2 to replicate data between the VM-based Kafka cluster and the new Kubernetes-based cluster. This allowed us to run both clusters in parallel, migrate consumers gradually, and validate data integrity before cutting over. The zero-downtime requirement made this non-negotiable.

The transition from Zookeeper to KRaft added another layer of complexity. KRaft was still relatively new in production environments, and we spent significant time validating its behavior under our specific workload patterns.

### 3. Secrets Management Was a 3-Week Detour

The legacy setup stored secrets in Ansible-managed configuration files and environment variables on VMs. The target was External Secrets Operator integrated with Azure Key Vault — a clean, centralized approach.

The challenge was the migration itself: identifying every secret across 60+ services, mapping them to Key Vault entries, configuring External Secrets for each namespace, and testing that every service could retrieve its secrets correctly across all environments. Edge cases appeared constantly — services that read secrets from files vs. environment variables, secrets with special characters that needed encoding, and cross-service secrets that had to be synchronized.

### 4. Ansible Doesn't Die Easily

We underestimated how long it takes to fully decommission an Ansible-based infrastructure. Ansible wasn't just managing Kafka — it managed NGINX configurations, system packages, user accounts, firewall rules, monitoring agents, and log rotation.

Each of these responsibilities had to be replaced with a Kubernetes-native equivalent: NGINX Ingress Controller replaced the VM-based reverse proxy, cert-manager replaced manual TLS management, Velero replaced VM-level backup scripts, and so on.

The decommissioning phase took longer than the Kubernetes migration itself. Legacy tooling has gravitational pull — every time you think you've removed the last dependency, another playbook surfaces.

### 5. mTLS Breaks Things You Didn't Expect

Introducing LinkerD for service mesh encryption was a security win but an operational challenge. MQTT and AMQP messaging infrastructure — which several microservices depended on — had protocol-level conflicts with mTLS proxy injection.

LinkerD's sidecar proxy intercepts TCP connections, but MQTT and AMQP have their own connection semantics that don't always play well with transparent proxying. We had to carefully configure protocol detection, skip lists, and custom annotations to ensure messaging infrastructure remained functional while still benefiting from mTLS on HTTP-based services.


## The Results

The migration delivered on every objective:

- Fully automated GitOps deployments replaced manual Ansible runs
- Self-healing Kubernetes pods replaced static VM configurations
- Centralized secrets management replaced scattered configuration files
- Zero-trust mTLS networking replaced flat VM networks
- Comprehensive observability replaced blind spots
- Multi-environment consistency replaced environment drift

The operations team went from spending 30%+ of their week on manual maintenance to focusing on platform improvements. Environment provisioning dropped from weeks to minutes. And the security posture improved dramatically — passing penetration tests that would have been challenging in the VM-based setup.


## Key Takeaways

If you're planning a similar migration, here's what we'd recommend:

**Start with MirrorMaker2 early.** Data migration is the constraint that defines your timeline, not the infrastructure migration.

**Don't underestimate the Ansible decommission.** Budget as much time for removing the old infrastructure as building the new one.

**Test mTLS with your actual protocols.** Not everything is HTTP, and service mesh proxies make assumptions about traffic patterns.

**Secrets migration is a project in itself.** Audit every secret before you start, not during the migration.

**Containerize a few services first.** Don't try to move 60+ services at once — start with 3-5, learn from the pain, and then scale the process.

---

*CloudCops specializes in enterprise Cloud & DevOps Engineering. If you're planning a migration to Kubernetes or building an internal developer platform, reach out at [cloudcops.com](https://cloudcops.com).*
