import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the createSwitch function call.
 */
export type CreateSwitch = CallResult<
    {
        switchId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the checkin function call.
 */
export type Checkin = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the storeData function call.
 */
export type StoreData = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the storeDecryptionKey function call.
 */
export type StoreDecryptionKey = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the trigger function call.
 */
export type Trigger = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the cancel function call.
 */
export type Cancel = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the updateBeneficiary function call.
 */
export type UpdateBeneficiary = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the updateInterval function call.
 */
export type UpdateInterval = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getSwitch function call.
 */
export type GetSwitch = CallResult<
    {
        owner: Address;
        beneficiary: Address;
        interval: bigint;
        gracePeriod: bigint;
        lastCheckin: bigint;
        status: bigint;
        triggerBlock: bigint;
        chunkCount: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getData function call.
 */
export type GetData = CallResult<
    {
        data: Uint8Array;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getDecryptionKey function call.
 */
export type GetDecryptionKey = CallResult<
    {
        encryptedKey: Uint8Array;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getSwitchCount function call.
 */
export type GetSwitchCount = CallResult<
    {
        count: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the isExpired function call.
 */
export type IsExpired = CallResult<
    {
        expired: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getSwitchesByOwner function call.
 */
export type GetSwitchesByOwner = CallResult<
    {
        count: bigint;
        switchIds: bigint;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// IDeadMansSwitchV2
// ------------------------------------------------------------------
export interface IDeadMansSwitchV2 extends IOP_NETContract {
    createSwitch(beneficiary: Address, interval: bigint, gracePeriod: bigint): Promise<CreateSwitch>;
    checkin(switchId: bigint): Promise<Checkin>;
    storeData(switchId: bigint, chunkIndex: bigint, encryptedData: Uint8Array): Promise<StoreData>;
    storeDecryptionKey(switchId: bigint, encryptedKey: Uint8Array): Promise<StoreDecryptionKey>;
    trigger(switchId: bigint): Promise<Trigger>;
    cancel(switchId: bigint): Promise<Cancel>;
    updateBeneficiary(switchId: bigint, newBeneficiary: Address): Promise<UpdateBeneficiary>;
    updateInterval(switchId: bigint, newInterval: bigint): Promise<UpdateInterval>;
    getSwitch(switchId: bigint): Promise<GetSwitch>;
    getData(switchId: bigint, chunkIndex: bigint): Promise<GetData>;
    getDecryptionKey(switchId: bigint): Promise<GetDecryptionKey>;
    getSwitchCount(): Promise<GetSwitchCount>;
    isExpired(switchId: bigint): Promise<IsExpired>;
    getSwitchesByOwner(owner: Address): Promise<GetSwitchesByOwner>;
}
