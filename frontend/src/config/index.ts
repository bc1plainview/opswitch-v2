/**
 * Application configuration for opSwitch V2.
 */
export const CONFIG = {
    /** The deployed Dead Man's Switch V2 contract address. */
    CONTRACT_ADDRESS: 'opr1sqqr6ct4d9myvwrj2mrvwm6y4eqg8fmar5sd8p8sw',

    /** RPC endpoints per network. */
    RPC: {
        regtest: 'https://regtest.opnet.org',
        mainnet: 'https://mainnet.opnet.org',
    },

    /** Default network to use. */
    DEFAULT_NETWORK: 'regtest' as const,

    /** Maximum chunk size in bytes for on-chain data storage. */
    MAX_CHUNK_SIZE: 8000,

    /** Approximate seconds per Bitcoin block (used for time estimates). */
    SECONDS_PER_BLOCK: 600,
} as const;
