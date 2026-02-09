import { Link } from 'react-router-dom';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useSwitches } from '../hooks/useSwitches.js';
import { useContractActions } from '../hooks/useContractActions.js';
import { SwitchCard } from '../components/SwitchCard.js';

/**
 * Main dashboard page showing all user switches.
 */
export function Dashboard(): React.JSX.Element {
    const { walletAddress } = useWalletConnect();
    const { switches, loading, error, refresh } = useSwitches();
    const { actionState, checkin } = useContractActions();

    if (!walletAddress) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h2 className="empty-state__title">Connect Your Wallet</h2>
                    <p className="empty-state__text">
                        Connect your OP_WALLET to view and manage your Dead Man's Switches.
                    </p>
                </div>
            </div>
        );
    }

    if (loading && switches.length === 0) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">My Switches</h1>
                </div>
                <div className="switch-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="switch-card switch-card--skeleton">
                            <div className="skeleton skeleton--title" />
                            <div className="skeleton skeleton--text" />
                            <div className="skeleton skeleton--text" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">My Switches</h1>
                </div>
                <div className="alert alert--error">{error}</div>
                <button className="btn btn--outline" onClick={refresh}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">My Switches</h1>
                <Link to="/create" className="btn btn--primary">
                    Create New Switch
                </Link>
            </div>

            {actionState.error && (
                <div className="alert alert--error">{actionState.error}</div>
            )}
            {actionState.txId && (
                <div className="alert alert--success">
                    Transaction submitted: {actionState.txId}
                </div>
            )}

            {switches.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h2 className="empty-state__title">No Switches Yet</h2>
                    <p className="empty-state__text">
                        Create your first Dead Man's Switch to get started.
                    </p>
                    <Link to="/create" className="btn btn--primary btn--lg">
                        Create Your First Switch
                    </Link>
                </div>
            ) : (
                <div className="switch-grid">
                    {switches.map((sw) => (
                        <SwitchCard
                            key={sw.switchId.toString()}
                            switchData={sw}
                            onCheckin={checkin}
                            actionLoading={actionState.loading}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
