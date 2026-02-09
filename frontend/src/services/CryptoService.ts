import { CONFIG } from '../config/index.js';

/**
 * Convert a Uint8Array to a guaranteed ArrayBuffer (not SharedArrayBuffer).
 * Required because TS strict mode treats .buffer as ArrayBuffer | SharedArrayBuffer.
 */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
    const buf = new ArrayBuffer(arr.byteLength);
    const view = new Uint8Array(buf);
    view.set(arr);
    return buf;
}

/**
 * Client-side encryption/decryption service using Web Crypto API.
 * Uses AES-256-GCM for file encryption.
 */
class CryptoService {
    private static instance: CryptoService;

    private constructor() {}

    public static getInstance(): CryptoService {
        if (!CryptoService.instance) {
            CryptoService.instance = new CryptoService();
        }
        return CryptoService.instance;
    }

    /**
     * Generate a random AES-256 key.
     *
     * @returns The raw key bytes (32 bytes)
     */
    public async generateKey(): Promise<Uint8Array> {
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt'],
        );
        const raw = await crypto.subtle.exportKey('raw', key);
        return new Uint8Array(raw);
    }

    /**
     * Encrypt data with AES-256-GCM.
     * Output format: [12 bytes IV][ciphertext + tag]
     *
     * @param data - Plaintext bytes
     * @param rawKey - 32-byte AES key
     * @returns Encrypted bytes (IV prepended)
     */
    public async encrypt(data: Uint8Array, rawKey: Uint8Array): Promise<Uint8Array> {
        const key = await crypto.subtle.importKey(
            'raw',
            toArrayBuffer(rawKey),
            'AES-GCM',
            false,
            ['encrypt'],
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            toArrayBuffer(data),
        );
        const result = new Uint8Array(iv.length + encrypted.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encrypted), iv.length);
        return result;
    }

    /**
     * Decrypt data encrypted with AES-256-GCM.
     * Expects format: [12 bytes IV][ciphertext + tag]
     *
     * @param encryptedData - Encrypted bytes with IV prepended
     * @param rawKey - 32-byte AES key
     * @returns Decrypted plaintext bytes
     */
    public async decrypt(
        encryptedData: Uint8Array,
        rawKey: Uint8Array,
    ): Promise<Uint8Array> {
        const key = await crypto.subtle.importKey(
            'raw',
            toArrayBuffer(rawKey),
            'AES-GCM',
            false,
            ['decrypt'],
        );
        const iv = encryptedData.slice(0, 12);
        const ciphertext = encryptedData.slice(12);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            toArrayBuffer(ciphertext),
        );
        return new Uint8Array(decrypted);
    }

    /**
     * Split data into chunks of the configured maximum size.
     *
     * @param data - Data to split
     * @returns Array of chunks
     */
    public splitIntoChunks(data: Uint8Array): Uint8Array[] {
        const chunks: Uint8Array[] = [];
        const chunkSize = CONFIG.MAX_CHUNK_SIZE;
        for (let offset = 0; offset < data.length; offset += chunkSize) {
            const end = Math.min(offset + chunkSize, data.length);
            chunks.push(data.slice(offset, end));
        }
        return chunks;
    }

    /**
     * Reassemble chunks into a single byte array.
     *
     * @param chunks - Ordered array of data chunks
     * @returns Combined byte array
     */
    public reassembleChunks(chunks: Uint8Array[]): Uint8Array {
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }
}

export const cryptoService = CryptoService.getInstance();
