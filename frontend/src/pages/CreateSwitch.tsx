import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useContractActions } from '../hooks/useContractActions.js';
import { formatBlockTime } from '../utils/formatting.js';

/**
 * Page for creating a new Dead Man's Switch.
 */
export function CreateSwitch(): React.JSX.Element {
    const { walletAddress } = useWalletConnect();
    const { actionState, createSwitch, resetAction } = useContractActions();
    const navigate = useNavigate();

    const [beneficiary, setBeneficiary] = useState('');
    const [intervalBlocks, setIntervalBlocks] = useState('');
    const [gracePeriodBlocks, setGracePeriodBlocks] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const intervalBigInt =
        intervalBlocks.length > 0 ? BigInt(intervalBlocks) : 0n;
    const gracePeriodBigInt =
        gracePeriodBlocks.length > 0 ? BigInt(gracePeriodBlocks) : 0n;

    const isFormValid =
        beneficiary.length > 0 &&
        intervalBigInt > 0n &&
        gracePeriodBigInt > 0n;

    const handlePreview = useCallback((): void => {
        if (isFormValid) {
            setShowPreview(true);
        }
    }, [isFormValid]);

    const handleCreate = useCallback(async (): Promise<void> => {
        resetAction();
        await createSwitch(beneficiary, intervalBigInt, gracePeriodBigInt);
    }, [beneficiary, intervalBigInt, gracePeriodBigInt, createSwitch, resetAction]);

    const handleBack = useCallback((): void => {
        setShowPreview(false);
        resetAction();
    }, [resetAction]);

    if (!walletAddress) {
        return (
            <div className="page-container">
                <h1 className="page-title">Create Switch</h1>
                <div className="card">
                    <p className="card__text">
                        Connect your wallet to create a new Dead Man's Switch.
                    </p>
                </div>
            </div>
        );
    }

    if (actionState.txId) {
        return (
            <div className="page-container">
                <h1 className="page-title">Switch Created</h1>
                <div className="alert alert--success">
                    Transaction submitted: {actionState.txId}
                </div>
                <p className="page-text">
                    Your switch is being created. It will appear on the dashboard
                    once the transaction is confirmed.
                </p>
                <button
                    className="btn btn--primary"
                    onClick={(): void => void navigate('/')}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (showPreview) {
        return (
            <div className="page-container">
                <h1 className="page-title">Confirm Switch Settings</h1>

                {actionState.error && (
                    <div className="alert alert--error">{actionState.error}</div>
                )}

                <div className="card">
                    <div className="detail-grid">
                        <div className="detail-row">
                            <span className="detail-row__label">Beneficiary</span>
                            <span className="detail-row__value detail-row__value--mono">
                                {beneficiary}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-row__label">
                                Heartbeat Interval
                            </span>
                            <span className="detail-row__value">
                                {intervalBlocks} blocks (
                                {formatBlockTime(intervalBigInt)})
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-row__label">Grace Period</span>
                            <span className="detail-row__value">
                                {gracePeriodBlocks} blocks (
                                {formatBlockTime(gracePeriodBigInt)})
                            </span>
                        </div>
                    </div>
                </div>

                <div className="btn-group">
                    <button
                        className="btn btn--outline"
                        onClick={handleBack}
                        disabled={actionState.loading}
                    >
                        Back
                    </button>
                    <button
                        className="btn btn--primary"
                        onClick={handleCreate}
                        disabled={actionState.loading}
                    >
                        {actionState.loading
                            ? 'Creating...'
                            : 'Create Switch'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Create New Switch</h1>
            <p className="page-text">
                Set up a Dead Man's Switch. If you fail to check in within the
                heartbeat interval, anyone can trigger the switch. The beneficiary
                will then gain access to any stored encrypted data.
            </p>

            <div className="card">
                <div className="form-group">
                    <label className="form-label" htmlFor="beneficiary">
                        Beneficiary Address
                    </label>
                    <input
                        id="beneficiary"
                        className="form-input"
                        type="text"
                        placeholder="bcrt1q... or 0x..."
                        value={beneficiary}
                        onChange={(e): void => setBeneficiary(e.target.value)}
                    />
                    <span className="form-hint">
                        The address that will receive access to data after trigger.
                    </span>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="interval">
                        Heartbeat Interval (blocks)
                    </label>
                    <input
                        id="interval"
                        className="form-input"
                        type="number"
                        min="1"
                        placeholder="e.g. 144 (~1 day)"
                        value={intervalBlocks}
                        onChange={(e): void => setIntervalBlocks(e.target.value)}
                    />
                    {intervalBigInt > 0n && (
                        <span className="form-hint">
                            {formatBlockTime(intervalBigInt)} estimated
                        </span>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="grace-period">
                        Grace Period (blocks)
                    </label>
                    <input
                        id="grace-period"
                        className="form-input"
                        type="number"
                        min="1"
                        placeholder="e.g. 6 (~1 hour)"
                        value={gracePeriodBlocks}
                        onChange={(e): void =>
                            setGracePeriodBlocks(e.target.value)
                        }
                    />
                    {gracePeriodBigInt > 0n && (
                        <span className="form-hint">
                            {formatBlockTime(gracePeriodBigInt)} for owner to
                            cancel after trigger
                        </span>
                    )}
                </div>
            </div>

            <button
                className="btn btn--primary btn--lg btn--full"
                onClick={handlePreview}
                disabled={!isFormValid}
            >
                Preview Settings
            </button>
        </div>
    );
}
