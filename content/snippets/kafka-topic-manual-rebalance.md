---
title: "Kafka Topic Manual Leader Rebalance via ZooKeeper"
description: "How to fix Kafka topics with incorrect or missing leaders by manually rewriting partition state in ZooKeeper."
date: "2026-01-20"
tags: [kafka, kubernetes, zookeeper, troubleshooting]
author:
  name: "Salih Kayiplar"
  url: "https://www.linkedin.com/in/salih-kayiplar-36ba69289/"
---

## The Problem

After a broker restart or failure, a Kafka topic partition can end up with the wrong leader (or `none`/`null`). Consumers can't read from the partition, producers get `NOT_LEADER_FOR_PARTITION` errors. Automatic leader election sometimes doesn't kick in.

## Fix: Manual Leader Rebalance

### 1. Check the Current State in ZooKeeper

```bash
kubectl exec -it messaging-zookeeper-0 -- zkCli.sh

# Check what's in the partition state
get /brokers/topics/<topic-name>/partitions/0/state
```

If the leader is `0`, `none`, or `null`, you need to fix it.

### 2. Rewrite the Partition State

```bash
# Delete the broken state
delete /brokers/topics/<topic-name>/partitions/0/state

# Create new state with the correct leader broker ID
create /brokers/topics/<topic-name>/partitions/0/state \
  '{"controller_epoch":1,"leader":1,"version":1,"leader_epoch":1,"isr":[1]}'
```

Replace `1` with the correct broker ID that should be the leader.

### 3. Verify via Kafka CLI

```bash
# Start a Kafka client pod
kubectl run kafka-client -n messaging --rm -ti \
  --image bitnami/kafka:3.1.0 -- bash

# Describe the topic to check the leader
kafka-topics.sh \
  --bootstrap-server messaging-kafka.messaging.svc.cluster.local:9092 \
  --describe --topic <topic-name>
```

### 4. Force Leader Election (if needed)

If the leader still isn't correct after rewriting the state:

```bash
kafka-leader-election.sh \
  --bootstrap-server messaging-kafka.messaging.svc.cluster.local:9092 \
  --election-type unclean \
  --topic <topic-name> \
  --partition 0
```

## Gotcha

**Unclean leader election can cause data loss.** The new leader may not have all the messages that the previous leader had. Only use `--election-type unclean` when the partition is completely unavailable and you accept potential message loss. For non-critical topics, this is usually acceptable. For financial or audit data, investigate further before forcing an unclean election.
