import { useWalletConnect, SupportedWallets } from '@btc-vision/walletconnect';
import { formatAddress } from '../utils/formatting.js';

/**
 * Wallet connect/disconnect button.
 */
export function WalletButton(): React.JSX.Element {
    const { walletAddress, connectToWallet, disconnect } =
        useWalletConnect();

    const handleConnect = (): void => {
        connectToWallet(SupportedWallets.OP_WALLET);
    };

    if (walletAddress) {
        return (
            <div className="wallet-info">
                <span className="wallet-info__address">
                    {formatAddress(walletAddress)}
                </span>
                <button className="btn btn--sm btn--outline" onClick={disconnect}>
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <button className="btn btn--primary btn--sm" onClick={handleConnect}>
            Connect Wallet
        </button>
    );
}
