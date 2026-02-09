import { useState, useCallback } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { Address } from '@btc-vision/transaction';
import { getContract, BaseContractProperties } from 'opnet';
import { DEAD_MANS_SWITCH_V2_ABI } from '../abi/DeadMansSwitchV2ABI.js';
import { CONFIG } from '../config/index.js';
import { providerService } from '../services/ProviderService.js';

/**
 * Dynamic dispatch type for contract methods added by ABI at runtime.
 */
type DynamicContract = Record<
    string,
    (
        ...args: unknown[]
    ) => Promise<{
        revert?: string;
        sendTransaction: (
            params: Record<string, unknown>,
        ) => Promise<{ transactionId: string }>;
    }>
>;

interface ActionState {
    loading: boolean;
    error: string | null;
    txId: string | null;
}

/**
 * Hook providing write actions for the Dead Man's Switch V2 contract.
 * All write operations simulate first, then call sendTransaction
 * with signer=null and mldsaSigner=null (wallet extension signs).
 */
export function useContractActions(): {
    actionState: ActionState;
    createSwitch: (
        beneficiary: string,
        interval: bigint,
        gracePeriod: bigint,
    ) => Promise<void>;
    checkin: (switchId: bigint) => Promise<void>;
    triggerSwitch: (switchId: bigint) => Promise<void>;
    cancelSwitch: (switchId: bigint) => Promise<void>;
    updateBeneficiary: (
        switchId: bigint,
        newBeneficiary: string,
    ) => Promise<void>;
    updateInterval: (
        switchId: bigint,
        newInterval: bigint,
    ) => Promise<void>;
    storeDataChunk: (
        switchId: bigint,
        chunkIndex: bigint,
        data: Uint8Array,
    ) => Promise<void>;
    storeDecryptionKey: (
        switchId: bigint,
        encryptedKey: Uint8Array,
    ) => Promise<void>;
    resetAction: () => void;
} {
    const { publicKey, hashedMLDSAKey, walletAddress, network } =
        useWalletConnect();
    const [actionState, setActionState] = useState<ActionState>({
        loading: false,
        error: null,
        txId: null,
    });

    const getWriteContract = useCallback((): DynamicContract => {
        if (!publicKey || !hashedMLDSAKey) {
            throw new Error('Wallet not connected');
        }

        const networkKey = CONFIG.DEFAULT_NETWORK;
        const provider = providerService.getProvider(networkKey);
        const btcNetwork = providerService.getNetwork(networkKey);
        const senderAddress = Address.fromString(hashedMLDSAKey, publicKey);

        const contract = getContract<BaseContractProperties>(
            CONFIG.CONTRACT_ADDRESS,
            DEAD_MANS_SWITCH_V2_ABI,
            provider,
            btcNetwork,
            senderAddress,
        );

        return contract as unknown as DynamicContract;
    }, [publicKey, hashedMLDSAKey]);

    const executeAction = useCallback(
        async (
            actionName: string,
            fn: (
                contract: DynamicContract,
            ) => Promise<{
                revert?: string;
                sendTransaction: (
                    params: Record<string, unknown>,
                ) => Promise<{ transactionId: string }>;
            }>,
        ): Promise<void> => {
            if (!walletAddress || !network) {
                setActionState({
                    loading: false,
                    error: 'Wallet not connected',
                    txId: null,
                });
                return;
            }

            setActionState({ loading: true, error: null, txId: null });
            try {
                const contract = getWriteContract();
                const simulation = await fn(contract);

                if (simulation.revert) {
                    setActionState({
                        loading: false,
                        error: `${actionName} would fail: ${simulation.revert}`,
                        txId: null,
                    });
                    return;
                }

                const networkKey = CONFIG.DEFAULT_NETWORK;
                const btcNetwork = providerService.getNetwork(networkKey);

                const receipt = await simulation.sendTransaction({
                    signer: null,
                    mldsaSigner: null,
                    refundTo: walletAddress,
                    maximumAllowedSatToSpend: 100000n,
                    feeRate: 10,
                    network: btcNetwork,
                });

                setActionState({
                    loading: false,
                    error: null,
                    txId: receipt.transactionId,
                });
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : `${actionName} failed`;
                setActionState({ loading: false, error: message, txId: null });
            }
        },
        [walletAddress, network, getWriteContract],
    );

    const createSwitch = useCallback(
        async (
            beneficiary: string,
            interval: bigint,
            gracePeriod: bigint,
        ): Promise<void> => {
            await executeAction('Create switch', async (contract) => {
                return await contract['createSwitch'](
                    beneficiary,
                    interval,
                    gracePeriod,
                );
            });
        },
        [executeAction],
    );

    const checkin = useCallback(
        async (switchId: bigint): Promise<void> => {
            await executeAction('Check-in', async (contract) => {
                return await contract['checkin'](switchId);
            });
        },
        [executeAction],
    );

    const triggerSwitch = useCallback(
        async (switchId: bigint): Promise<void> => {
            await executeAction('Trigger', async (contract) => {
                return await contract['trigger'](switchId);
            });
        },
        [executeAction],
    );

    const cancelSwitch = useCallback(
        async (switchId: bigint): Promise<void> => {
            await executeAction('Cancel', async (contract) => {
                return await contract['cancel'](switchId);
            });
        },
        [executeAction],
    );

    const updateBeneficiary = useCallback(
        async (switchId: bigint, newBeneficiary: string): Promise<void> => {
            await executeAction('Update beneficiary', async (contract) => {
                return await contract['updateBeneficiary'](
                    switchId,
                    newBeneficiary,
                );
            });
        },
        [executeAction],
    );

    const updateInterval = useCallback(
        async (switchId: bigint, newInterval: bigint): Promise<void> => {
            await executeAction('Update interval', async (contract) => {
                return await contract['updateInterval'](switchId, newInterval);
            });
        },
        [executeAction],
    );

    const storeDataChunk = useCallback(
        async (
            switchId: bigint,
            chunkIndex: bigint,
            data: Uint8Array,
        ): Promise<void> => {
            await executeAction(
                `Store chunk ${chunkIndex}`,
                async (contract) => {
                    return await contract['storeData'](
                        switchId,
                        chunkIndex,
                        data,
                    );
                },
            );
        },
        [executeAction],
    );

    const storeDecryptionKey = useCallback(
        async (switchId: bigint, encryptedKey: Uint8Array): Promise<void> => {
            await executeAction('Store decryption key', async (contract) => {
                return await contract['storeDecryptionKey'](
                    switchId,
                    encryptedKey,
                );
            });
        },
        [executeAction],
    );

    const resetAction = useCallback((): void => {
        setActionState({ loading: false, error: null, txId: null });
    }, []);

    return {
        actionState,
        createSwitch,
        checkin,
        triggerSwitch,
        cancelSwitch,
        updateBeneficiary,
        updateInterval,
        storeDataChunk,
        storeDecryptionKey,
        resetAction,
    };
}
