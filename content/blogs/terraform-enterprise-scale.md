---
title: "How to Structure Terraform for Enterprise: Modules, Terragrunt, and Testing"
description: "Practical patterns from managing 50+ Terraform modules across enterprise clients — including when to use Terragrunt, how to test infrastructure code, and the mistakes that create unmaintainable codebases."
date: "2026-03-23"
tags: [Terraform, Terragrunt, IaC, DevOps, Azure, Testing, Enterprise]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salihkayiplar/"
image: "/images/terraform-enterprise-cover.png"
---

## Background

Terraform is easy to start and difficult to scale. A single `main.tf` with a few resources works for a side project. It stops working around the time you have multiple environments, multiple teams, and compliance requirements that demand auditability.

We've written and maintained Terraform codebases for enterprise clients across automotive, energy, logistics, banking, and e-commerce. Some of these started as clean architectures. Most were inherited as tangled state files with no testing, no module versioning, and no clear ownership boundaries.

This article covers how we structure Terraform for enterprises that need it to last — not just work once. It includes the patterns we've standardized on, the role of Terragrunt, and why testing infrastructure code is the single most impactful practice most teams skip.


## The Problem with "Just Use Terraform"

Every Terraform project starts the same way: a few `.tf` files in a directory, a state file in an S3 bucket or Azure Storage Account, and a `terraform apply` that works on the first try. Then it grows.

Environment proliferation is the first pain. You need dev, staging, and production. The instinct is to copy the directory three times and change the variable values. Now you have three copies of the same infrastructure code, and when you fix a bug in one, you have to remember to apply it to the other two. You will forget.

Team boundaries are the second pain. The networking team needs to manage VNets and subnets. The platform team needs to manage AKS clusters and their configurations. The security team needs to manage Key Vaults and access policies. If everyone works in the same Terraform state, a plan that touches networking will also show changes to the AKS cluster — even if nobody intended to modify it. Lock contention on the state file becomes a daily friction.

The third pain is module sprawl. Teams start extracting modules for reuse, but without versioning or a registry, modules are copied between repositories and diverge immediately. Six months later, there are four versions of the "AKS cluster" module across different projects, each with subtle differences that nobody can explain.


## The Module Architecture

We structure every enterprise Terraform codebase around versioned, tested modules that are consumed — never modified — by environment-specific configurations.

### Module Design Principles

**One module, one responsibility.** An AKS module provisions an AKS cluster. It doesn't also create the VNet, the Key Vault, or the monitoring workspace. Those are separate modules with their own lifecycle.

**Opinionated defaults, explicit overrides.** Modules ship with sensible defaults that reflect our security and operational standards. Node pool auto-scaling is enabled by default. Managed identity is the default authentication method. Public API server access is disabled by default. Teams can override these, but they have to do it explicitly — which creates a paper trail in code review.

**Semantic versioning.** Every module has a version. Breaking changes increment the major version. New features increment the minor version. Bug fixes increment the patch version. Environment configurations pin to specific versions, and upgrades are deliberate pull requests — not silent changes that propagate automatically.

At one automotive client, we manage 15+ modules covering networking, compute, identity, storage, monitoring, and database resources. Each module has its own repository, its own CI pipeline, and its own release process. When the platform team needs a new AKS feature, they update the AKS module, release a new version, and then update each environment's configuration to reference the new version.

### Example Module Structure

A typical module repository looks like this:

```
terraform-azurerm-aks/
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── README.md
├── examples/
│   ├── basic/
│   └── advanced/
└── tests/
    ├── basic_test.go
    └── advanced_test.go
```

The `examples/` directory isn't documentation — it's the test fixtures. Each example is a complete, deployable configuration that Terratest uses to validate the module works as expected.


## When Terragrunt Makes Sense (and When It Doesn't)

Terragrunt adds a configuration layer on top of Terraform that solves three specific problems: DRY environment configurations, dependency management between state files, and consistent backend configuration.

### When to use Terragrunt

**Multiple environments with shared module configurations.** Instead of copying your Terraform configuration for each environment and changing variables, Terragrunt lets you define the module source and common variables once, and override per-environment values in thin configuration files. The cognitive overhead of "which environment am I changing" drops significantly.

**Cross-state dependencies.** Your AKS cluster needs the VNet ID from the networking state. Your monitoring configuration needs the Log Analytics Workspace ID from the platform state. Terragrunt's `dependency` blocks make these cross-references explicit and type-safe, instead of relying on data sources that can fail silently.

**Consistent backend configuration.** Every state file needs a backend — storage account, container, key, resource group. Terragrunt generates these consistently from a single root configuration, which eliminates the copy-paste errors that lead to state file conflicts or accidentally sharing state between environments.

A typical Terragrunt structure:

```
live/
├── terragrunt.hcl              # Root config: backend, providers
├── dev/
│   ├── env.hcl                 # Dev-specific variables
│   ├── networking/
│   │   └── terragrunt.hcl      # Points to networking module
│   ├── aks/
│   │   └── terragrunt.hcl      # Points to AKS module, depends on networking
│   └── monitoring/
│       └── terragrunt.hcl      # Points to monitoring module, depends on AKS
├── staging/
│   └── ...                     # Same structure, different env.hcl
└── production/
    └── ...                     # Same structure, different env.hcl
```

### When to skip Terragrunt

If you have one environment, one team, and fewer than ten modules, Terragrunt adds complexity without proportional benefit. Plain Terraform with workspaces or directory-based environments is simpler to understand, easier to onboard new engineers to, and has one less tool in the dependency chain.

We've seen teams adopt Terragrunt prematurely and spend more time debugging Terragrunt-specific behaviors than they save on environment management. The threshold is roughly: if you have three or more environments and cross-state dependencies, Terragrunt pays for itself. Below that, it's overhead.


## Testing Infrastructure Code

This is the section most teams skip, and it's the single most impactful practice we introduce at enterprise clients.

### Why teams don't test Terraform

The common objections: "it's too slow," "it's too expensive," "we test in staging," and "Terraform plan is our test." Each of these is wrong in ways that become obvious after the first production incident caused by a module upgrade.

`terraform plan` tells you what Terraform will do. It doesn't tell you whether the result works. A plan can succeed, an apply can succeed, and the AKS cluster can come up with a node pool configuration that can't schedule any pods because the VM size doesn't have enough memory for the DaemonSets. Plan doesn't catch this. A test does.

"We test in staging" means you test the happy path once, manually, and then trust that production — with different network ranges, different RBAC configurations, and different resource quotas — will behave identically. It won't.

### How we test

We use Terratest — a Go library that provisions real infrastructure, validates it, and tears it down. Every module has at least one integration test that:

1. Deploys the module with example inputs
2. Verifies the resources exist and have the expected properties
3. Runs functional checks (can I connect to this? does this endpoint respond?)
4. Destroys everything

These tests run in CI on every pull request to a module repository. They provision real Azure resources in a dedicated testing subscription, which means they take 10-20 minutes and cost a few cents per run. This is not a prohibitive cost — it's insurance against breaking production.

At a banking client, introducing Terratest caught a regression where a module update changed the default network policy from "deny all" to "allow all" — a change that passed Terraform plan and would have passed manual staging review because the application still worked. The test caught it because it explicitly validated the network policy configuration.

### What to test

Not everything needs integration tests. We prioritize:

**Security-relevant configurations.** Network policies, RBAC bindings, encryption settings, public access flags. These are the configurations where a silent default change causes the most damage.

**Cross-resource dependencies.** Does the AKS cluster correctly reference the subnet? Does the Key Vault access policy grant the right identity? These fail silently when IDs or references change.

**Operational configurations.** Auto-scaling boundaries, backup retention policies, diagnostic settings. These are the settings that work fine on Day 1 and cause incidents on Day 30 when you realize backups weren't actually running.


## Common Mistakes at Scale

### Giant state files

A single state file containing 500+ resources takes minutes to plan, creates lock contention across teams, and makes targeted applies impossible. Split state by responsibility boundary — networking, compute, platform services, monitoring. Each state file should be manageable by one team and plannable in under a minute.

### No module versioning

Teams that consume modules directly from `main` branch are living on a prayer. A breaking change merged at 2 PM triggers a plan at 3 PM that proposes destroying your load balancer. Version pinning is non-negotiable. Upgrades are intentional.

### Provider version drift

Terraform providers release frequently, and new versions occasionally change resource behavior. Pin your provider versions in every module and every root configuration. Upgrade providers deliberately, in a tested PR, not as a side effect of running `terraform init` on a new workstation.

### No state file protection

State files contain sensitive data — resource IDs, connection strings, sometimes plaintext secrets. State backends need encryption at rest, access logging, and restricted access. We've audited Terraform setups where the state file storage account was publicly accessible. This is more common than it should be.


## Key Takeaways

**Modules are libraries, not templates.** Version them, test them, and treat changes as releases — not commits.

**Terragrunt solves real problems but creates new ones.** Use it when you have enough environments and cross-state dependencies to justify the abstraction. Don't adopt it because it's trendy.

**Test your infrastructure code.** Terratest isn't fast and it isn't free, but it's cheaper than the production incident it prevents. Start with security-relevant configurations and expand from there.

**Split state by team boundary.** If two teams need to plan against the same state file, you've found a boundary that needs splitting.

**Pin everything.** Module versions, provider versions, Terraform version. Reproducibility is the difference between infrastructure as code and infrastructure as coincidence.

---

*CloudCops specializes in enterprise Cloud & DevOps Engineering. If you're building or restructuring a Terraform codebase for scale, reach out at [cloudcops.com](https://cloudcops.com).*
