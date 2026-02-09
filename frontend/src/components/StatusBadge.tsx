import { SwitchStatus } from '../types/index.js';

interface StatusBadgeProps {
    status: SwitchStatus;
}

/**
 * Returns the CSS modifier class for a given switch status.
 */
function getStatusClass(status: SwitchStatus): string {
    switch (status) {
        case SwitchStatus.ACTIVE:
            return 'badge--active';
        case SwitchStatus.TRIGGERED:
            return 'badge--triggered';
        case SwitchStatus.CANCELLED:
            return 'badge--cancelled';
        default:
            return '';
    }
}

/**
 * Returns the display label for a given switch status.
 */
function getStatusLabel(status: SwitchStatus): string {
    switch (status) {
        case SwitchStatus.ACTIVE:
            return 'ACTIVE';
        case SwitchStatus.TRIGGERED:
            return 'TRIGGERED';
        case SwitchStatus.CANCELLED:
            return 'CANCELLED';
        default:
            return 'UNKNOWN';
    }
}

/**
 * Status badge component for switch status display.
 */
export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
    return (
        <span className={`badge ${getStatusClass(status)}`}>
            {getStatusLabel(status)}
        </span>
    );
}
