import { Blockchain } from '@btc-vision/btc-runtime/runtime';
import { revertOnError } from '@btc-vision/btc-runtime/runtime/abort/abort';
import { DeadMansSwitchV2 } from './DeadMansSwitchV2';

// Factory function - REQUIRED
Blockchain.contract = (): DeadMansSwitchV2 => {
    return new DeadMansSwitchV2();
};

// Runtime exports - REQUIRED
export * from '@btc-vision/btc-runtime/runtime/exports';

// Abort handler - REQUIRED
export function abort(message: string, fileName: string, line: u32, column: u32): void {
    revertOnError(message, fileName, line, column);
}
