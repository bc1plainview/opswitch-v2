import { ABIDataTypes, BitcoinAbiTypes, OP_NET_ABI } from 'opnet';

export const DeadMansSwitchV2Events = [];

export const DeadMansSwitchV2Abi = [
    {
        name: 'createSwitch',
        inputs: [
            { name: 'beneficiary', type: ABIDataTypes.ADDRESS },
            { name: 'interval', type: ABIDataTypes.UINT256 },
            { name: 'gracePeriod', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'checkin',
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'storeData',
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'chunkIndex', type: ABIDataTypes.UINT256 },
            { name: 'encryptedData', type: ABIDataTypes.BYTES },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'storeDecryptionKey',
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'encryptedKey', type: ABIDataTypes.BYTES },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'trigger',
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'cancel',
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'updateBeneficiary',
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'newBeneficiary', type: ABIDataTypes.ADDRESS },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'updateInterval',
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'newInterval', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getSwitch',
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
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getData',
        inputs: [
            { name: 'switchId', type: ABIDataTypes.UINT256 },
            { name: 'chunkIndex', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'data', type: ABIDataTypes.BYTES }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getDecryptionKey',
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'encryptedKey', type: ABIDataTypes.BYTES }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getSwitchCount',
        inputs: [],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'isExpired',
        inputs: [{ name: 'switchId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'expired', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getSwitchesByOwner',
        inputs: [{ name: 'owner', type: ABIDataTypes.ADDRESS }],
        outputs: [
            { name: 'count', type: ABIDataTypes.UINT256 },
            { name: 'switchIds', type: ABIDataTypes.UINT256 },
        ],
        type: BitcoinAbiTypes.Function,
    },
    ...DeadMansSwitchV2Events,
    ...OP_NET_ABI,
];

export default DeadMansSwitchV2Abi;
