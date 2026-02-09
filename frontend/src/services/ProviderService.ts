import { JSONRpcProvider } from 'opnet';
import { networks, Network } from '@btc-vision/bitcoin';
import { CONFIG } from '../config/index.js';

/**
 * Singleton provider service.
 * Creates and caches JSONRpcProvider instances per network.
 * NEVER use walletconnect's provider for reads -- always use this.
 */
class ProviderService {
    private static instance: ProviderService;
    private providers: Map<string, JSONRpcProvider> = new Map();

    private constructor() {}

    public static getInstance(): ProviderService {
        if (!ProviderService.instance) {
            ProviderService.instance = new ProviderService();
        }
        return ProviderService.instance;
    }

    /**
     * Get or create a cached provider for the given network key.
     *
     * @param networkKey - 'regtest' or 'mainnet'
     * @returns A cached JSONRpcProvider instance
     */
    public getProvider(
        networkKey: 'regtest' | 'mainnet' = CONFIG.DEFAULT_NETWORK,
    ): JSONRpcProvider {
        if (!this.providers.has(networkKey)) {
            const rpcUrl = CONFIG.RPC[networkKey];
            const network = this.getNetwork(networkKey);
            const provider = new JSONRpcProvider(rpcUrl, network);
            this.providers.set(networkKey, provider);
        }
        const cached = this.providers.get(networkKey);
        if (!cached) {
            throw new Error(`Failed to create provider for ${networkKey}`);
        }
        return cached;
    }

    /**
     * Resolve a network key to a bitcoin Network object.
     */
    public getNetwork(networkKey: 'regtest' | 'mainnet'): Network {
        switch (networkKey) {
            case 'mainnet':
                return networks.bitcoin;
            case 'regtest':
                return networks.regtest;
            default:
                return networks.regtest;
        }
    }

    /**
     * Clear all cached providers (call on network switch).
     */
    public clearCache(): void {
        this.providers.clear();
    }
}

export const providerService = ProviderService.getInstance();
