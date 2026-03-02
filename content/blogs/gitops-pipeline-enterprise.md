---
title: "The 5-Layer GitOps Pipeline We Use for Every Enterprise Client"
description: "How we structure GitOps across infrastructure, platform, security, observability, and application layers — and why treating them as one flat repo doesn't scale."
date: "2026-03-02"
tags: [GitOps, ArgoCD, Kubernetes, Terraform, DevOps, Platform Engineering]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salihkayiplar/"
image: "/images/gitops-pipeline-cover.png"
---

## Background

GitOps sounds simple: put everything in Git, let a controller sync it to your cluster, done. In practice, most teams hit a wall around month three. The single repo becomes a monolith. Changes to a monitoring dashboard trigger full-cluster syncs. An intern's Helm values change takes down the ingress controller. Nobody knows which ApplicationSet owns what.

We've deployed GitOps pipelines for enterprises across energy, logistics, banking, and e-commerce — each with different compliance requirements, team structures, and risk tolerances. What stayed consistent was the architecture. Every production GitOps setup we've built follows the same five-layer structure.

This article breaks down those layers, explains why they need to be separate, and covers the mistakes that make teams abandon GitOps entirely.


## Why Flat GitOps Fails at Scale

The typical starting point is a single Git repository with all Kubernetes manifests. ArgoCD or FluxCD watches it, syncs everything, and for a while it works beautifully. Then reality sets in:

A network policy change and a frontend deployment end up in the same pull request. The platform team and the application team are reviewing each other's code without the context to do it well. Rollbacks become surgical nightmares because a single commit touches three unrelated layers. Sync waves and dependency ordering become brittle configurations instead of structural guarantees.

The core problem is coupling. Infrastructure changes and application deployments have different risk profiles, different approval workflows, different blast radiuses, and different rollback strategies. Treating them as one stream of changes is the organizational equivalent of deploying your database schema migration and your CSS fix in the same pipeline.


## The Five Layers

### Layer 1: Infrastructure

This layer lives outside the Kubernetes cluster entirely. Terraform and Terragrunt modules provision the cloud environment — AKS clusters, VNets, subnets, Key Vaults, storage accounts, DNS zones, and managed databases. Changes go through Terraform plan reviews in CI and are applied via dedicated pipelines.

We typically structure this as a Terragrunt monorepo with environment-specific configurations. The key principle: nothing in this layer is deployed via ArgoCD. Infrastructure changes are too impactful and too slow to be managed by a continuous sync controller. They need explicit plan-and-apply workflows with human approval gates.

At one client, we manage 15+ Terraform modules covering networking, compute, identity, and monitoring — all versioned independently, all tested with Terratest before merge.

### Layer 2: Platform

This is the Kubernetes platform itself — the components that every application depends on but no application team should manage. NGINX Ingress Controller, cert-manager, External Secrets Operator, Velero for backups, ArgoCD itself, and cluster-wide RBAC configurations.

These components are deployed via ArgoCD but owned by the platform team. They have their own repository, their own sync policies, and their own promotion workflow. Changes here are reviewed by senior engineers because a misconfiguration in the ingress controller or cert-manager affects every service in the cluster.

We enforce strict sync policies on this layer: auto-sync is disabled for critical components like ingress and service mesh. Changes are synced manually after review.

### Layer 3: Security

OPA Gatekeeper constraint templates, network policies, Pod Security Standards, and LinkerD service mesh configurations live in their own layer. This separation exists for one reason: audit trails.

When an auditor asks "show me your pod security policies and when they last changed," you need a clean Git history that isn't polluted with application deployments and Helm value bumps. Every change in this layer has a clear commit message, a clear reviewer, and a clear reason.

At an energy sector client, this separation was the difference between passing and failing a compliance audit. The auditor could trace every security policy change back to a ticket, a review, and an approval — without parsing through hundreds of unrelated commits.

### Layer 4: Observability

Prometheus rules, Grafana dashboards, Alertmanager configurations, Loki and Tempo configurations, and ServiceMonitor resources. This layer changes frequently — teams add dashboards, tune alert thresholds, create new recording rules — and it needs to move fast without risking the stability of platform or security layers.

We've seen teams where a Grafana dashboard JSON file is 3,000 lines in a PR alongside an NGINX configuration change. Nobody reviews the dashboard because it's buried. Nobody reviews the NGINX change because the diff is overwhelming. Separating observability into its own layer makes both reviews manageable.

### Layer 5: Applications

This is where application teams live. Each team gets a namespace, an ArgoCD AppProject with scoped permissions, and ownership of their own manifests. They can deploy, roll back, and configure their services without touching anything in layers 1 through 4.

The critical design decision: application teams cannot modify cluster-wide resources. They can't create ClusterRoles, they can't install CRDs, they can't change network policies. OPA Gatekeeper enforces these boundaries at admission time, and ArgoCD AppProjects enforce them at sync time.

This isn't about trust — it's about blast radius. An application team should be able to break their own service without breaking the platform.


## How the Layers Connect

ArgoCD manages layers 2 through 5 with separate ApplicationSets per layer. Each layer has its own sync policy, its own notification configuration, and its own health checks.

The dependency chain flows downward: infrastructure must exist before the platform can be installed, the platform must be healthy before security policies are applied, security policies must be in place before observability is configured, and observability must be running before applications are deployed.

In practice, this means initial cluster bootstrapping follows a specific order. But once the cluster is running, each layer operates independently. An application deployment doesn't wait for an observability change, and a security policy update doesn't trigger an application re-sync.

We use ArgoCD sync waves for the initial bootstrap and then rely on health checks and resource hooks for ongoing operations. The key is that layer boundaries are structural — enforced by repository separation and RBAC — not just organizational conventions that erode over time.


## The Mistakes That Kill GitOps Adoption

### Not separating environments properly

We've inherited GitOps setups where dev, staging, and production configurations were managed through branch strategies — dev branch for development, main for production. This creates a merge-based promotion model that breaks down when you need to hotfix production without pulling in everything on the dev branch.

We use directory-based environment separation within each layer's repository. Kustomize overlays handle environment-specific values. Promotion from staging to production is an explicit PR that changes only the production overlay.

### Giving ArgoCD cluster-admin

ArgoCD needs permissions to deploy resources, but giving it cluster-admin is the Kubernetes equivalent of running everything as root. We scope ArgoCD's permissions per AppProject, per namespace, and per resource type. The ArgoCD service account for the application layer cannot modify resources in the platform layer's namespaces.

### Ignoring drift detection

GitOps means the Git repository is the source of truth. But if someone kubectl-edits a resource directly, ArgoCD will show it as out of sync. Many teams disable auto-sync or ignore drift warnings because they're noisy. This defeats the entire purpose.

We configure ArgoCD to alert on drift and auto-revert unauthorized changes. If a change needs to happen, it goes through Git. No exceptions. This is uncomfortable at first — especially for engineers used to quick kubectl fixes — but it's the only way to maintain auditability.


## Key Takeaways

**Separate by risk, not by technology.** The five layers exist because they have different risk profiles and different change frequencies, not because they use different tools.

**Infrastructure stays outside ArgoCD.** Terraform plan-and-apply workflows are fundamentally different from continuous sync controllers. Don't force them into the same model.

**Enforce boundaries structurally.** Repository separation plus RBAC plus OPA Gatekeeper. Conventions without enforcement are just documentation that nobody reads.

**Application teams should be autonomous within their layer.** If deploying a new version requires a platform team review, your GitOps pipeline is a ticketing system with extra steps.

**Start with two layers, not five.** If you're just beginning with GitOps, start by separating platform from applications. Add the other layers as your organization's maturity demands them.

---

*CloudCops specializes in enterprise Cloud & DevOps Engineering. If you're building a GitOps pipeline or internal developer platform, reach out at [cloudcops.com](https://cloudcops.com).*
