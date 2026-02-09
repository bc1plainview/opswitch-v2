import { Link } from 'react-router-dom';
import { SwitchData, SwitchStatus } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { formatAddress, formatBlockTime } from '../utils/formatting.js';

interface SwitchCardProps {
    switchData: SwitchData;
    onCheckin: (switchId: bigint) => Promise<void>;
    actionLoading: boolean;
}

/**
 * Card component displaying a single switch summary on the dashboard.
 */
export function SwitchCard({
    switchData,
    onCheckin,
    actionLoading,
}: SwitchCardProps): React.JSX.Element {
    const handleCheckin = async (e: React.MouseEvent): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();
        await onCheckin(switchData.switchId);
    };

    return (
        <Link
            to={`/switch/${switchData.switchId.toString()}`}
            className="switch-card"
        >
            <div className="switch-card__header">
                <span className="switch-card__id">
                    Switch #{switchData.switchId.toString()}
                </span>
                <StatusBadge status={switchData.status} />
            </div>

            <div className="switch-card__body">
                <div className="switch-card__row">
                    <span className="switch-card__label">Beneficiary</span>
                    <span className="switch-card__value">
                        {formatAddress(switchData.beneficiary)}
                    </span>
                </div>
                <div className="switch-card__row">
                    <span className="switch-card__label">Last Check-in</span>
                    <span className="switch-card__value">
                        Block {switchData.lastCheckin.toString()}
                    </span>
                </div>
                <div className="switch-card__row">
                    <span className="switch-card__label">Interval</span>
                    <span className="switch-card__value">
                        {switchData.interval.toString()} blocks (
                        {formatBlockTime(switchData.interval)})
                    </span>
                </div>
            </div>

            {switchData.status === SwitchStatus.ACTIVE && (
                <div className="switch-card__footer">
                    <button
                        className="btn btn--checkin btn--sm"
                        onClick={handleCheckin}
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Processing...' : 'Check In'}
                    </button>
                </div>
            )}
        </Link>
    );
}
