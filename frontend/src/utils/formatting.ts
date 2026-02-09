import { CONFIG } from '../config/index.js';

/**
 * Truncate an address or hex string for display.
 *
 * @param address - Full address string
 * @param chars - Number of characters to show on each side
 * @returns Truncated address string
 */
export function formatAddress(address: string, chars: number = 6): string {
    if (address.length <= chars * 2 + 3) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Convert a block count to a human-readable time estimate.
 *
 * @param blocks - Number of blocks
 * @returns Human-readable time string
 */
export function formatBlockTime(blocks: bigint): string {
    const totalSeconds = Number(blocks) * CONFIG.SECONDS_PER_BLOCK;

    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }
    if (totalSeconds < 3600) {
        const minutes = Math.floor(totalSeconds / 60);
        return `~${minutes} min`;
    }
    if (totalSeconds < 86400) {
        const hours = Math.floor(totalSeconds / 3600);
        return `~${hours} hr`;
    }
    const days = Math.floor(totalSeconds / 86400);
    return `~${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Format file size in human-readable units.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g. "1.5 KB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Convert a Uint8Array to a hex string.
 *
 * @param data - Byte array
 * @returns Hex-encoded string
 */
export function bytesToHex(data: Uint8Array): string {
    return Array.from(data)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Convert a hex string to Uint8Array.
 *
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Byte array
 */
export function hexToBytes(hex: string): Uint8Array {
    const clean = hex.replace(/^0x/, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}
