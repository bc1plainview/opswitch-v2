import { getContract, BaseContractProperties } from 'opnet';
import { Address } from '@btc-vision/transaction';
import { Network } from '@btc-vision/bitcoin';
import { JSONRpcProvider } from 'opnet';
import { DEAD_MANS_SWITCH_V2_ABI } from '../abi/DeadMansSwitchV2ABI.js';
import { CONFIG } from '../config/index.js';
import { providerService } from './ProviderService.js';
import { SwitchData, SwitchStatus } from '../types/index.js';

/**
 * Helper type for dynamic method dispatch on the contract.
 * Custom ABI methods are added at runtime, so we need dynamic access.
 */
type DynamicContract = Record<
    string,
    (
        ...args: unknown[]
    ) => Promise<{ properties: Record<string, unknown> }>
>;

/**
 * Cast a typed contract to a dynamic dispatch interface.
 */
function asDynamic(
    contract: ReturnType<typeof getContract<BaseContractProperties>>,
): DynamicContract {
    return contract as unknown as DynamicContract;
}

/**
 * Parse a raw bigint status value to the SwitchStatus enum.
 */
function parseStatus(raw: bigint): SwitchStatus {
    if (raw === 0n) return SwitchStatus.ACTIVE;
    if (raw === 1n) return SwitchStatus.TRIGGERED;
    return SwitchStatus.CANCELLED;
}

/**
 * Service for interacting with the Dead Man's Switch V2 contract.
 * Caches contract instances and provides typed read/write methods.
 */
class ContractService {
    private static instance: ContractService;
    private contractCache: Map<
        string,
        ReturnType<typeof getContract<BaseContractProperties>>
    > = new Map();

    private constructor() {}

    public static getInstance(): ContractService {
        if (!ContractService.instance) {
            ContractService.instance = new ContractService();
        }
        return ContractService.instance;
    }

    /**
     * Get a cached contract instance for reads.
     */
    public getReadContract(
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
        senderAddress?: Address,
    ): ReturnType<typeof getContract<BaseContractProperties>> {
        const senderHex = senderAddress?.toHex() ?? 'none';
        const cacheKey = `${networkKey}:${CONFIG.CONTRACT_ADDRESS}:${senderHex}`;

        if (!this.contractCache.has(cacheKey)) {
            const provider: JSONRpcProvider = providerService.getProvider(networkKey);
            const network: Network = providerService.getNetwork(networkKey);
            const contract = getContract<BaseContractProperties>(
                CONFIG.CONTRACT_ADDRESS,
                DEAD_MANS_SWITCH_V2_ABI,
                provider,
                network,
                senderAddress,
            );
            this.contractCache.set(cacheKey, contract);
        }

        const cached = this.contractCache.get(cacheKey);
        if (!cached) {
            throw new Error('Failed to get contract instance');
        }
        return cached;
    }

    /**
     * Fetch the list of switchIds owned by an address.
     */
    public async fetchSwitchIdsByOwner(
        ownerAddress: Address,
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
    ): Promise<bigint[]> {
        const contract = this.getReadContract(networkKey, ownerAddress);
        const dyn = asDynamic(contract);
        const result = await dyn['getSwitchesByOwner'](ownerAddress);

        const count = result.properties['count'] as bigint;
        if (count === 0n) return [];

        const switchIds = result.properties['switchIds'];
        if (Array.isArray(switchIds)) {
            return switchIds as bigint[];
        }
        return [switchIds as bigint];
    }

    /**
     * Fetch full metadata for a single switch by ID.
     */
    public async fetchSwitch(
        switchId: bigint,
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
        senderAddress?: Address,
    ): Promise<SwitchData> {
        const contract = this.getReadContract(networkKey, senderAddress);
        const dyn = asDynamic(contract);
        const result = await dyn['getSwitch'](switchId);
        const p = result.properties;

        return {
            switchId,
            owner: String(p['owner'] ?? ''),
            beneficiary: String(p['beneficiary'] ?? ''),
            interval: p['interval'] as bigint,
            gracePeriod: p['gracePeriod'] as bigint,
            lastCheckin: p['lastCheckin'] as bigint,
            status: parseStatus(p['status'] as bigint),
            triggerBlock: p['triggerBlock'] as bigint,
            chunkCount: p['chunkCount'] as bigint,
        };
    }

    /**
     * Fetch full data for multiple switches by their IDs.
     */
    public async fetchSwitches(
        switchIds: bigint[],
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
        senderAddress?: Address,
    ): Promise<SwitchData[]> {
        const promises = switchIds.map((id) =>
            this.fetchSwitch(id, networkKey, senderAddress),
        );
        return Promise.all(promises);
    }

    /**
     * Check if a switch's heartbeat has expired.
     */
    public async checkIsExpired(
        switchId: bigint,
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
    ): Promise<boolean> {
        const contract = this.getReadContract(networkKey);
        const dyn = asDynamic(contract);
        const result = await dyn['isExpired'](switchId);
        return result.properties['expired'] as boolean;
    }

    /**
     * Fetch a single encrypted data chunk.
     */
    public async fetchChunk(
        switchId: bigint,
        chunkIndex: bigint,
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
    ): Promise<Uint8Array> {
        const contract = this.getReadContract(networkKey);
        const dyn = asDynamic(contract);
        const result = await dyn['getData'](switchId, chunkIndex);
        return result.properties['data'] as Uint8Array;
    }

    /**
     * Fetch the encrypted decryption key (only after trigger).
     */
    public async fetchDecryptionKey(
        switchId: bigint,
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
    ): Promise<Uint8Array> {
        const contract = this.getReadContract(networkKey);
        const dyn = asDynamic(contract);
        const result = await dyn['getDecryptionKey'](switchId);
        return result.properties['encryptedKey'] as Uint8Array;
    }

    /**
     * Get total number of switches created.
     */
    public async fetchSwitchCount(
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
    ): Promise<bigint> {
        const contract = this.getReadContract(networkKey);
        const dyn = asDynamic(contract);
        const result = await dyn['getSwitchCount']();
        return result.properties['count'] as bigint;
    }

    /**
     * Clear contract cache (on network change).
     */
    public clearCache(): void {
        this.contractCache.clear();
    }
}

export const contractService = ContractService.getInstance();
