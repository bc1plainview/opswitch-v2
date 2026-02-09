/**
 * Contract status enum matching on-chain values.
 * STATUS_ACTIVE=0, STATUS_TRIGGERED=1, STATUS_CANCELLED=2
 */
export enum SwitchStatus {
    ACTIVE = 0,
    TRIGGERED = 1,
    CANCELLED = 2,
}

/**
 * Full metadata for a single switch fetched from getSwitch().
 */
export interface SwitchData {
    switchId: bigint;
    owner: string;
    beneficiary: string;
    interval: bigint;
    gracePeriod: bigint;
    lastCheckin: bigint;
    status: SwitchStatus;
    triggerBlock: bigint;
    chunkCount: bigint;
}

/**
 * Upload progress state for the store-data flow.
 */
export interface UploadProgress {
    currentChunk: number;
    totalChunks: number;
    phase: 'encrypting' | 'uploading' | 'storing-key' | 'complete' | 'error';
    error?: string;
}

/**
 * Download progress state for the retrieve-data flow.
 */
export interface DownloadProgress {
    currentChunk: number;
    totalChunks: number;
    phase: 'fetching-key' | 'fetching-chunks' | 'decrypting' | 'complete' | 'error';
    error?: string;
}
