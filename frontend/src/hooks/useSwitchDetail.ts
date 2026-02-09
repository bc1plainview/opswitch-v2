import { useState, useEffect, useCallback } from 'react';
import { Address } from '@btc-vision/transaction';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { contractService } from '../services/ContractService.js';
import { CONFIG } from '../config/index.js';
import { SwitchData } from '../types/index.js';

/**
 * Hook that fetches a single switch's data by its ID.
 * Refreshes periodically and on demand.
 */
export function useSwitchDetail(switchId: bigint): {
    switchData: SwitchData | null;
    isExpired: boolean;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
} {
    const { publicKey, hashedMLDSAKey } = useWalletConnect();
    const [switchData, setSwitchData] = useState<SwitchData | null>(null);
    const [isExpired, setIsExpired] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetail = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            let senderAddress: Address | undefined;
            if (publicKey && hashedMLDSAKey) {
                senderAddress = Address.fromString(hashedMLDSAKey, publicKey);
            }

            const [data, expired] = await Promise.all([
                contractService.fetchSwitch(
                    switchId,
                    CONFIG.DEFAULT_NETWORK,
                    senderAddress,
                ),
                contractService.checkIsExpired(switchId, CONFIG.DEFAULT_NETWORK),
            ]);

            setSwitchData(data);
            setIsExpired(expired);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Failed to fetch switch detail';
            setError(message);
            setSwitchData(null);
        } finally {
            setLoading(false);
        }
    }, [switchId, publicKey, hashedMLDSAKey]);

    useEffect(() => {
        void fetchDetail();
        const interval = setInterval(() => {
            void fetchDetail();
        }, 15000);
        return (): void => clearInterval(interval);
    }, [fetchDetail]);

    return { switchData, isExpired, loading, error, refresh: fetchDetail };
}
