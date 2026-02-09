import { ABIDataTypes, BitcoinAbiTypes, BitcoinInterfaceAbi } from 'opnet';

/**
 * ABI definition for the Dead Man's Switch V2 multi-tenant contract.
 * Matches all 14 on-chain methods exactly.
 */
export const DEAD_MANS_SWITCH_V2_ABI: BitcoinInterfaceAbi = [
    {
        name: 'createSwitch',
        type: BitcoinAbiTypes.Function,
        constant: false,
        inputs: [
            { name: 'beneficiary', type: ABIDataTypes.ADDRESS },
            { name: 'interval', type: ABIDataTypes.UINT256 },
            { name: 'gracePeriod', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'checkin',
        type: BitcoinAbiTypes.Function,
        constant: false,
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'storeData',
        type: BitcoinAbiTypes.Function,
        constant: false,
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'chunkIndex', type: ABIDataTypes.UINT256 },
            { name: 'encryptedData', type: ABIDataTypes.BYTES },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'storeDecryptionKey',
        type: BitcoinAbiTypes.Function,
        constant: false,
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'encryptedKey', type: ABIDataTypes.BYTES },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'trigger',
        type: BitcoinAbiTypes.Function,
        constant: false,
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'cancel',
        type: BitcoinAbiTypes.Function,
        constant: false,
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'updateBeneficiary',
        type: BitcoinAbiTypes.Function,
        constant: false,
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'newBeneficiary', type: ABIDataTypes.ADDRESS },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'updateInterval',
        type: BitcoinAbiTypes.Function,
        constant: false,
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'newInterval', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'getSwitch',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [
            { name: 'owner', type: ABIDataTypes.ADDRESS },
            { name: 'beneficiary', type: ABIDataTypes.ADDRESS },
            { name: 'interval', type: ABIDataTypes.UINT256 },
            { name: 'gracePeriod', type: ABIDataTypes.UINT256 },
            { name: 'lastCheckin', type: ABIDataTypes.UINT256 },
            { name: 'status', type: ABIDataTypes.UINT256 },
            { name: 'triggerBlock', type: ABIDataTypes.UINT256 },
            { name: 'chunkCount', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'getData',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'chunkIndex', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'data', type: ABIDataTypes.BYTES }],
    },
    {
        name: 'getDecryptionKey',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'encryptedKey', type: ABIDataTypes.BYTES }],
    },
    {
        name: 'getSwitchCount',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'isExpired',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'expired', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'getSwitchesByOwner',
        type: BitcoinAbiTypes.Function,
        constant: true,
        inputs: [{ name: 'owner', type: ABIDataTypes.ADDRESS }],
        outputs: [
            { name: 'count', type: ABIDataTypes.UINT256 },
            { name: 'switchIds', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'SwitchCreated',
        type: BitcoinAbiTypes.Event,
        values: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'owner', type: ABIDataTypes.ADDRESS },
            { name: 'beneficiary', type: ABIDataTypes.ADDRESS },
        ],
    },
    {
        name: 'CheckedIn',
        type: BitcoinAbiTypes.Event,
        values: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'blockHeight', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'DataStored',
        type: BitcoinAbiTypes.Event,
        values: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'chunkIndex', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'SwitchTriggered',
        type: BitcoinAbiTypes.Event,
        values: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'beneficiary', type: ABIDataTypes.ADDRESS },
            { name: 'blockHeight', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'SwitchCancelled',
        type: BitcoinAbiTypes.Event,
        values: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'blockHeight', type: ABIDataTypes.UINT256 },
        ],
    },
    {
        name: 'BeneficiaryUpdated',
        type: BitcoinAbiTypes.Event,
        values: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'newBeneficiary', type: ABIDataTypes.ADDRESS },
        ],
    },
];
