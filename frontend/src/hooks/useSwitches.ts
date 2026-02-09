import { useState, useEffect, useCallback } from 'react';
import { Address } from '@btc-vision/transaction';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { contractService } from '../services/ContractService.js';
import { CONFIG } from '../config/index.js';
import { SwitchData } from '../types/index.js';

/**
 * Hook that fetches the user's switches from the V2 multi-tenant contract.
 * Returns the list of switch data, loading state, error state, and a refresh function.
 */
export function useSwitches(): {
    switches: SwitchData[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
} {
    const { publicKey, hashedMLDSAKey } = useWalletConnect();
    const [switches, setSwitches] = useState<SwitchData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSwitches = useCallback(async (): Promise<void> => {
        if (!publicKey || !hashedMLDSAKey) {
            setSwitches([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const senderAddress = Address.fromString(hashedMLDSAKey, publicKey);
            const switchIds = await contractService.fetchSwitchIdsByOwner(
                senderAddress,
                CONFIG.DEFAULT_NETWORK,
            );

            if (switchIds.length === 0) {
                setSwitches([]);
                setLoading(false);
                return;
            }

            const switchDataList = await contractService.fetchSwitches(
                switchIds,
                CONFIG.DEFAULT_NETWORK,
                senderAddress,
            );
            setSwitches(switchDataList);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Failed to fetch switches';
            setError(message);
            setSwitches([]);
        } finally {
            setLoading(false);
        }
    }, [publicKey, hashedMLDSAKey]);

    useEffect(() => {
        void fetchSwitches();
        const interval = setInterval(() => {
            void fetchSwitches();
        }, 30000);
        return (): void => clearInterval(interval);
    }, [fetchSwitches]);

    return { switches, loading, error, refresh: fetchSwitches };
}
