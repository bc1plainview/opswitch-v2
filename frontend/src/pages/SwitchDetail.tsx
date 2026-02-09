import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useSwitchDetail } from '../hooks/useSwitchDetail.js';
import { useContractActions } from '../hooks/useContractActions.js';
import { contractService } from '../services/ContractService.js';
import { cryptoService } from '../services/CryptoService.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { CountdownBar } from '../components/CountdownBar.js';
import { SwitchStatus, UploadProgress, DownloadProgress } from '../types/index.js';
import {
    formatAddress,
    formatBlockTime,
    formatFileSize,
    bytesToHex,
    hexToBytes,
} from '../utils/formatting.js';
import { CONFIG } from '../config/index.js';

/**
 * Detailed view of a single switch with all management actions.
 */
export function SwitchDetail(): React.JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { walletAddress } = useWalletConnect();
    const switchId = BigInt(id ?? '0');
    const { switchData, isExpired, loading, error, refresh } = useSwitchDetail(switchId);
    const {
        actionState,
        checkin,
        triggerSwitch,
        cancelSwitch,
        updateBeneficiary,
        updateInterval,
        storeDataChunk,
        storeDecryptionKey,
        resetAction,
    } = useContractActions();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
    const [aesKeyHex, setAesKeyHex] = useState<string | null>(null);
    const [manualKey, setManualKey] = useState('');
    const [newBeneficiary, setNewBeneficiary] = useState('');
    const [newInterval, setNewInterval] = useState('');
    const [showUpdateBeneficiary, setShowUpdateBeneficiary] = useState(false);
    const [showUpdateInterval, setShowUpdateInterval] = useState(false);
    const [releaseMode, setReleaseMode] = useState<'private' | 'public'>('private');

    const handleFileSelect = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const file = event.target.files?.[0];
            if (file) {
                setSelectedFile(file);
                setUploadProgress(null);
                setAesKeyHex(null);
            }
        },
        [],
    );

    const handleUpload = useCallback(async (): Promise<void> => {
        if (!selectedFile) return;

        try {
            setUploadProgress({
                currentChunk: 0,
                totalChunks: 0,
                phase: 'encrypting',
            });

            const fileData = new Uint8Array(await selectedFile.arrayBuffer());
            const aesKey = await cryptoService.generateKey();
            const encrypted = await cryptoService.encrypt(fileData, aesKey);

            setAesKeyHex(bytesToHex(aesKey));

            const chunks = cryptoService.splitIntoChunks(encrypted);
            setUploadProgress({
                currentChunk: 0,
                totalChunks: chunks.length,
                phase: 'uploading',
            });

            for (let i = 0; i < chunks.length; i++) {
                setUploadProgress({
                    currentChunk: i + 1,
                    totalChunks: chunks.length,
                    phase: 'uploading',
                });
                const chunkData = chunks[i];
                if (chunkData) {
                    await storeDataChunk(switchId, BigInt(i), chunkData);
                }
            }

            setUploadProgress({
                currentChunk: chunks.length,
                totalChunks: chunks.length,
                phase: 'storing-key',
            });
            await storeDecryptionKey(switchId, aesKey);

            setUploadProgress({
                currentChunk: chunks.length,
                totalChunks: chunks.length,
                phase: 'complete',
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            setUploadProgress({
                currentChunk: 0,
                totalChunks: 0,
                phase: 'error',
                error: message,
            });
        }
    }, [selectedFile, switchId, storeDataChunk, storeDecryptionKey]);

    const handleRetrieve = useCallback(async (): Promise<void> => {
        if (!switchData) return;

        try {
            const totalChunks = Number(switchData.chunkCount);
            setDownloadProgress({
                currentChunk: 0,
                totalChunks,
                phase: 'fetching-key',
            });

            let aesKeyBytes: Uint8Array;
            if (manualKey.length > 0) {
                aesKeyBytes = hexToBytes(manualKey);
            } else {
                aesKeyBytes = await contractService.fetchDecryptionKey(
                    switchId,
                    CONFIG.DEFAULT_NETWORK,
                );
            }

            const chunks: Uint8Array[] = [];
            for (let i = 0; i < totalChunks; i++) {
                setDownloadProgress({
                    currentChunk: i + 1,
                    totalChunks,
                    phase: 'fetching-chunks',
                });
                const chunk = await contractService.fetchChunk(
                    switchId,
                    BigInt(i),
                    CONFIG.DEFAULT_NETWORK,
                );
                chunks.push(chunk);
            }

            setDownloadProgress({
                currentChunk: totalChunks,
                totalChunks,
                phase: 'decrypting',
            });

            const encryptedData = cryptoService.reassembleChunks(chunks);
            const decryptedData = await cryptoService.decrypt(encryptedData, aesKeyBytes);

            const blobBuf = new ArrayBuffer(decryptedData.byteLength);
            new Uint8Array(blobBuf).set(decryptedData);
            const blob = new Blob([blobBuf]);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'recovered-file';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);

            setDownloadProgress({
                currentChunk: totalChunks,
                totalChunks,
                phase: 'complete',
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Retrieval failed';
            setDownloadProgress({
                currentChunk: 0,
                totalChunks: Number(switchData?.chunkCount ?? 0n),
                phase: 'error',
                error: message,
            });
        }
    }, [switchData, switchId, manualKey]);

    const handleUpdateBeneficiary = useCallback(async (): Promise<void> => {
        if (newBeneficiary.length === 0) return;
        resetAction();
        await updateBeneficiary(switchId, newBeneficiary);
        setShowUpdateBeneficiary(false);
        setNewBeneficiary('');
        void refresh();
    }, [switchId, newBeneficiary, updateBeneficiary, resetAction, refresh]);

    const handleUpdateInterval = useCallback(async (): Promise<void> => {
        if (newInterval.length === 0) return;
        resetAction();
        await updateInterval(switchId, BigInt(newInterval));
        setShowUpdateInterval(false);
        setNewInterval('');
        void refresh();
    }, [switchId, newInterval, updateInterval, resetAction, refresh]);

    if (loading && !switchData) {
        return (
            <div className="page-container">
                <div className="card">
                    <div className="skeleton skeleton--title" />
                    <div className="skeleton skeleton--text" />
                    <div className="skeleton skeleton--text" />
                    <div className="skeleton skeleton--text" />
                </div>
            </div>
        );
    }

    if (error || !switchData) {
        return (
            <div className="page-container">
                <div className="alert alert--error">
                    {error ?? 'Switch not found'}
                </div>
                <button
                    className="btn btn--outline"
                    onClick={(): void => void navigate('/')}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const isOwner =
        walletAddress !== undefined &&
        walletAddress !== null &&
        walletAddress.length > 0;

    return (
        <div className="page-container">
            <button
                className="btn btn--text btn--back"
                onClick={(): void => void navigate('/')}
            >
                Back to Dashboard
            </button>

            <div className="page-header">
                <h1 className="page-title">
                    Switch #{switchData.switchId.toString()}
                </h1>
                <StatusBadge status={switchData.status} />
            </div>

            {actionState.error && (
                <div className="alert alert--error">{actionState.error}</div>
            )}
            {actionState.txId && (
                <div className="alert alert--success">
                    Transaction submitted: {actionState.txId}
                </div>
            )}

            {switchData.status === SwitchStatus.ACTIVE && (
                <div className="card">
                    <div className="card__label">Time Until Expiry</div>
                    <CountdownBar
                        lastCheckin={switchData.lastCheckin}
                        interval={switchData.interval}
                        isExpired={isExpired}
                    />
                </div>
            )}

            <div className="card">
                <h2 className="card__title">Switch Details</h2>
                <div className="detail-grid">
                    <div className="detail-row">
                        <span className="detail-row__label">Owner</span>
                        <span className="detail-row__value detail-row__value--mono">
                            {formatAddress(switchData.owner, 10)}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-row__label">Beneficiary</span>
                        <span className="detail-row__value detail-row__value--mono">
                            {formatAddress(switchData.beneficiary, 10)}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-row__label">
                            Heartbeat Interval
                        </span>
                        <span className="detail-row__value">
                            {switchData.interval.toString()} blocks (
                            {formatBlockTime(switchData.interval)})
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-row__label">Grace Period</span>
                        <span className="detail-row__value">
                            {switchData.gracePeriod.toString()} blocks (
                            {formatBlockTime(switchData.gracePeriod)})
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-row__label">
                            Last Check-in
                        </span>
                        <span className="detail-row__value">
                            Block {switchData.lastCheckin.toString()}
                        </span>
                    </div>
                    {switchData.triggerBlock > 0n && (
                        <div className="detail-row">
                            <span className="detail-row__label">
                                Trigger Block
                            </span>
                            <span className="detail-row__value">
                                Block {switchData.triggerBlock.toString()}
                            </span>
                        </div>
                    )}
                    <div className="detail-row">
                        <span className="detail-row__label">
                            Stored Chunks
                        </span>
                        <span className="detail-row__value">
                            {switchData.chunkCount.toString()}
                        </span>
                    </div>
                </div>
            </div>

            {isOwner && switchData.status === SwitchStatus.ACTIVE && (
                <div className="card">
                    <h2 className="card__title">Actions</h2>
                    <div className="action-group">
                        <button
                            className="btn btn--checkin btn--lg btn--full"
                            onClick={async (): Promise<void> => {
                                resetAction();
                                await checkin(switchId);
                                void refresh();
                            }}
                            disabled={actionState.loading}
                        >
                            {actionState.loading ? 'Processing...' : 'CHECK IN'}
                        </button>

                        {isExpired && (
                            <button
                                className="btn btn--danger btn--lg btn--full"
                                onClick={async (): Promise<void> => {
                                    resetAction();
                                    await triggerSwitch(switchId);
                                    void refresh();
                                }}
                                disabled={actionState.loading}
                            >
                                {actionState.loading
                                    ? 'Processing...'
                                    : 'TRIGGER SWITCH'}
                            </button>
                        )}

                        <div className="action-row">
                            {!showUpdateBeneficiary ? (
                                <button
                                    className="btn btn--outline btn--sm"
                                    onClick={(): void =>
                                        setShowUpdateBeneficiary(true)
                                    }
                                >
                                    Update Beneficiary
                                </button>
                            ) : (
                                <div className="inline-form">
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder="New beneficiary address"
                                        value={newBeneficiary}
                                        onChange={(e): void =>
                                            setNewBeneficiary(e.target.value)
                                        }
                                    />
                                    <button
                                        className="btn btn--primary btn--sm"
                                        onClick={handleUpdateBeneficiary}
                                        disabled={
                                            actionState.loading ||
                                            newBeneficiary.length === 0
                                        }
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        className="btn btn--outline btn--sm"
                                        onClick={(): void =>
                                            setShowUpdateBeneficiary(false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {!showUpdateInterval ? (
                                <button
                                    className="btn btn--outline btn--sm"
                                    onClick={(): void =>
                                        setShowUpdateInterval(true)
                                    }
                                >
                                    Update Interval
                                </button>
                            ) : (
                                <div className="inline-form">
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="1"
                                        placeholder="New interval (blocks)"
                                        value={newInterval}
                                        onChange={(e): void =>
                                            setNewInterval(e.target.value)
                                        }
                                    />
                                    <button
                                        className="btn btn--primary btn--sm"
                                        onClick={handleUpdateInterval}
                                        disabled={
                                            actionState.loading ||
                                            newInterval.length === 0
                                        }
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        className="btn btn--outline btn--sm"
                                        onClick={(): void =>
                                            setShowUpdateInterval(false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {switchData.status === SwitchStatus.TRIGGERED && isOwner && (
                <div className="card">
                    <h2 className="card__title">Grace Period</h2>
                    <p className="card__text">
                        The switch has been triggered. You can cancel within the
                        grace period to reactivate it.
                    </p>
                    <button
                        className="btn btn--warning btn--lg btn--full"
                        onClick={async (): Promise<void> => {
                            resetAction();
                            await cancelSwitch(switchId);
                            void refresh();
                        }}
                        disabled={actionState.loading}
                    >
                        {actionState.loading ? 'Processing...' : 'CANCEL (Reactivate)'}
                    </button>
                </div>
            )}

            {isExpired &&
                switchData.status === SwitchStatus.ACTIVE && (
                    <div className="card">
                        <h2 className="card__title">Switch Expired</h2>
                        <p className="card__text">
                            The heartbeat has expired. Anyone can trigger this switch.
                        </p>
                        <button
                            className="btn btn--danger btn--lg btn--full"
                            onClick={async (): Promise<void> => {
                                resetAction();
                                await triggerSwitch(switchId);
                                void refresh();
                            }}
                            disabled={actionState.loading}
                        >
                            {actionState.loading ? 'Processing...' : 'TRIGGER SWITCH'}
                        </button>
                    </div>
                )}

            {isOwner && switchData.status === SwitchStatus.ACTIVE && (
                <div className="card">
                    <h2 className="card__title">Store Encrypted Data</h2>
                    <p className="card__text">
                        Upload a file to encrypt and store on-chain. The
                        decryption key will only become accessible after the
                        switch is triggered.
                    </p>

                    <div className="release-mode">
                        <label className="release-mode__label">Release Mode</label>
                        <div className="release-mode__options">
                            <button
                                className={`release-mode__btn ${releaseMode === 'private' ? 'release-mode__btn--active' : ''}`}
                                onClick={(): void => setReleaseMode('private')}
                                type="button"
                            >
                                Private -- Only beneficiary can decrypt
                            </button>
                            <button
                                className={`release-mode__btn ${releaseMode === 'public' ? 'release-mode__btn--active' : ''}`}
                                onClick={(): void => setReleaseMode('public')}
                                type="button"
                            >
                                Public -- Anyone can decrypt after trigger
                            </button>
                        </div>
                        <p className="release-mode__hint">
                            {releaseMode === 'private'
                                ? 'The decryption key will be encrypted to the beneficiary\'s public key. Only they can decrypt.'
                                : 'The decryption key will be stored in plaintext. After trigger, anyone can read it and decrypt the data.'}
                        </p>
                    </div>

                    <div
                        className="file-upload"
                        onClick={(): void => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="file-upload__input"
                        />
                        {selectedFile ? (
                            <div className="file-upload__name">
                                {selectedFile.name} (
                                {formatFileSize(selectedFile.size)})
                            </div>
                        ) : (
                            <div className="file-upload__label">
                                Click to select a file for encryption
                            </div>
                        )}
                    </div>

                    {uploadProgress && (
                        <div className="progress-section">
                            {uploadProgress.phase === 'encrypting' && (
                                <div className="progress-text">
                                    Encrypting file...
                                </div>
                            )}
                            {uploadProgress.phase === 'uploading' && (
                                <>
                                    <div className="progress-text">
                                        Storing chunk{' '}
                                        {uploadProgress.currentChunk} of{' '}
                                        {uploadProgress.totalChunks}
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar__fill progress-bar__fill--safe"
                                            style={{
                                                width: `${uploadProgress.totalChunks > 0 ? Math.round((uploadProgress.currentChunk / uploadProgress.totalChunks) * 100) : 0}%`,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                            {uploadProgress.phase === 'storing-key' && (
                                <div className="progress-text">
                                    Storing decryption key on-chain...
                                </div>
                            )}
                            {uploadProgress.phase === 'complete' && (
                                <div className="alert alert--success">
                                    Data stored successfully.{' '}
                                    {uploadProgress.totalChunks} chunk(s)
                                    uploaded.
                                </div>
                            )}
                            {uploadProgress.phase === 'error' && (
                                <div className="alert alert--error">
                                    {uploadProgress.error}
                                </div>
                            )}
                        </div>
                    )}

                    {aesKeyHex && uploadProgress?.phase === 'complete' && (
                        <div className="key-display">
                            <div className="key-display__label">
                                AES Key (save this securely)
                            </div>
                            <div className="key-display__value">{aesKeyHex}</div>
                        </div>
                    )}

                    <button
                        className="btn btn--primary btn--lg btn--full"
                        onClick={handleUpload}
                        disabled={
                            !selectedFile ||
                            actionState.loading ||
                            uploadProgress?.phase === 'complete'
                        }
                    >
                        {actionState.loading
                            ? 'Processing...'
                            : uploadProgress?.phase === 'complete'
                              ? 'Upload Complete'
                              : 'Encrypt and Store On-Chain'}
                    </button>
                </div>
            )}

            {switchData.status === SwitchStatus.TRIGGERED &&
                switchData.chunkCount > 0n && (
                    <div className="card">
                        <h2 className="card__title">Retrieve Data</h2>
                        <p className="card__text">
                            The switch has been triggered. You can retrieve and
                            decrypt the stored data ({switchData.chunkCount.toString()}{' '}
                            chunks).
                        </p>

                        <div className="form-group">
                            <label className="form-label" htmlFor="manual-key">
                                Decryption Key (optional)
                            </label>
                            <input
                                id="manual-key"
                                className="form-input"
                                type="text"
                                placeholder="64-character hex key"
                                value={manualKey}
                                onChange={(e): void =>
                                    setManualKey(e.target.value)
                                }
                            />
                            <span className="form-hint">
                                Leave empty to fetch from contract.
                            </span>
                        </div>

                        {downloadProgress && (
                            <div className="progress-section">
                                {downloadProgress.phase === 'fetching-key' && (
                                    <div className="progress-text">
                                        Fetching decryption key...
                                    </div>
                                )}
                                {downloadProgress.phase ===
                                    'fetching-chunks' && (
                                    <>
                                        <div className="progress-text">
                                            Fetching chunk{' '}
                                            {downloadProgress.currentChunk} of{' '}
                                            {downloadProgress.totalChunks}
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-bar__fill progress-bar__fill--safe"
                                                style={{
                                                    width: `${downloadProgress.totalChunks > 0 ? Math.round((downloadProgress.currentChunk / downloadProgress.totalChunks) * 100) : 0}%`,
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                                {downloadProgress.phase === 'decrypting' && (
                                    <div className="progress-text">
                                        Decrypting data...
                                    </div>
                                )}
                                {downloadProgress.phase === 'complete' && (
                                    <div className="alert alert--success">
                                        File decrypted and downloaded.
                                    </div>
                                )}
                                {downloadProgress.phase === 'error' && (
                                    <div className="alert alert--error">
                                        {downloadProgress.error}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            className="btn btn--primary btn--lg btn--full"
                            onClick={handleRetrieve}
                            disabled={
                                downloadProgress?.phase ===
                                    'fetching-chunks' ||
                                downloadProgress?.phase === 'decrypting'
                            }
                        >
                            {downloadProgress?.phase === 'complete'
                                ? 'Retrieve Again'
                                : 'Retrieve and Decrypt'}
                        </button>
                    </div>
                )}

            {switchData.status === SwitchStatus.CANCELLED && (
                <div className="alert alert--error">
                    This switch has been cancelled. No further actions are available.
                </div>
            )}
        </div>
    );
}
