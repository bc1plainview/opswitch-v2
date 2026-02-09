# Dead Man's Switch V2 - Multi-Tenant Factory

A permissionless, multi-tenant Dead Man's Switch smart contract for OPNet (Bitcoin L1).

## Overview

V2 evolves from the single-switch V1 into a **factory pattern within a single contract**. Since OPNet contracts cannot deploy other contracts (no CREATE/CREATE2 opcodes), V2 manages multiple independent switches internally, each identified by a unique auto-incrementing `switchId`.

**Any user can create a switch — no admin required.**

## How It Works

1. **Create a Switch**: Call `createSwitch(beneficiary, interval, gracePeriod)` to get a unique `switchId`
2. **Store Encrypted Data**: Use `storeData()` and `storeDecryptionKey()` to store encrypted content on-chain
3. **Check In Regularly**: Call `checkin(switchId)` within the heartbeat interval to keep the switch alive
4. **Trigger**: If the owner misses a heartbeat, anyone can call `trigger(switchId)` to activate the switch
5. **Grace Period**: After triggering, the owner has a grace period to `cancel(switchId)` and reclaim control
6. **Key Release**: Once triggered (and grace period expired), the beneficiary can retrieve the decryption key via `getDecryptionKey(switchId)`

## Switch States

| Status | Value | Description |
|--------|-------|-------------|
| ACTIVE | 0 | Normal operation, owner is checking in |
| TRIGGERED | 1 | Heartbeat expired, switch has been triggered |
| CANCELLED | 2 | Owner cancelled during grace period |

## Contract Methods

### Write Methods (State-Changing)

| Method | Access | Description |
|--------|--------|-------------|
| `createSwitch(beneficiary, interval, gracePeriod)` | Anyone | Creates a new switch, returns switchId |
| `checkin(switchId)` | Owner | Resets heartbeat timer |
| `storeData(switchId, chunkIndex, encryptedData)` | Owner | Stores encrypted data chunk |
| `storeDecryptionKey(switchId, encryptedKey)` | Owner | Stores encrypted decryption key |
| `trigger(switchId)` | Anyone | Triggers if heartbeat expired |
| `cancel(switchId)` | Owner | Cancels during grace period |
| `updateBeneficiary(switchId, newBeneficiary)` | Owner | Changes beneficiary address |
| `updateInterval(switchId, newInterval)` | Owner | Changes heartbeat interval |

### Read Methods

| Method | Description |
|--------|-------------|
| `getSwitch(switchId)` | Returns all switch metadata |
| `getData(switchId, chunkIndex)` | Returns encrypted data chunk |
| `getDecryptionKey(switchId)` | Returns encrypted key (only after triggered) |
| `getSwitchCount()` | Total number of switches created |
| `isExpired(switchId)` | Whether heartbeat has expired |
| `getSwitchesByOwner(owner)` | List of switchIds owned by address (max 100) |

## Events

| Event | Data |
|-------|------|
| `SwitchCreated` | switchId, owner, beneficiary |
| `CheckedIn` | switchId, blockHeight |
| `DataStored` | switchId, chunkIndex |
| `SwitchTriggered` | switchId, beneficiary, blockHeight |
| `SwitchCancelled` | switchId, blockHeight |
| `BeneficiaryUpdated` | switchId, newBeneficiary |

## Storage Design

Each switch's state is stored in separate pointer-keyed maps to avoid collisions:

- **Pointer 0**: `nextSwitchId` — auto-incrementing counter (starts at 1)
- **Pointers 1-8**: Per-switch metadata maps (owner, beneficiary, interval, grace, lastCheckin, status, triggerBlock, chunkCount)
- **Pointer 9**: Encrypted decryption keys (keyed by switchId)
- **Pointer 10**: Encrypted data chunks (compound key: switchId + chunkIndex)
- **Pointers 11-12**: Owner-to-switch tracking (count + index mapping)

All pointers are allocated via `Blockchain.nextPointer` — never hardcoded.

## Building

```bash
npm install
npm run build
```

The compiled WASM will be at `build/DeadMansSwitchV2.wasm`.

## Security Features

- **SafeMath**: All u256 arithmetic uses SafeMath (overflow/underflow protection)
- **Bounded loops**: No `while` loops; all iteration is bounded
- **Access control**: Owner-only methods enforce sender validation
- **Input validation**: All inputs validated (zero address, zero interval, bounds checks)
- **Storage isolation**: Each switch's data is completely isolated via unique pointer derivation

## Differences from V1

| Feature | V1 | V2 |
|---------|----|----|
| Switches per contract | 1 | Unlimited |
| Deployment | One contract per switch | One contract for all |
| Owner set on | Deployment calldata | `createSwitch()` call |
| Switch identification | N/A (single switch) | Unique switchId (u256) |
| Permissionless creation | No (set at deploy) | Yes (anyone can create) |
| Owner tracking | N/A | Per-owner index mapping |
