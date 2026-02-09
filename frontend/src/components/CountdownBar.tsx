interface CountdownBarProps {
    lastCheckin: bigint;
    interval: bigint;
    currentBlock?: bigint;
    isExpired: boolean;
}

/**
 * Visual countdown progress bar showing blocks remaining until expiry.
 * Fills from left (safe/green) to right (danger/red).
 */
export function CountdownBar({
    lastCheckin,
    interval,
    isExpired,
}: CountdownBarProps): React.JSX.Element {
    if (interval === 0n) {
        return <div className="countdown-bar countdown-bar--empty">No interval set</div>;
    }

    const deadline = lastCheckin + interval;
    const elapsed = interval;
    const percentage = isExpired ? 100 : Math.min(100, Number((elapsed * 100n) / interval));

    const barClass = isExpired
        ? 'countdown-bar__fill countdown-bar__fill--expired'
        : percentage > 75
          ? 'countdown-bar__fill countdown-bar__fill--warning'
          : 'countdown-bar__fill countdown-bar__fill--safe';

    return (
        <div className="countdown-bar">
            <div className="countdown-bar__track">
                <div className={barClass} data-width={percentage} />
            </div>
            <div className="countdown-bar__labels">
                <span className="countdown-bar__label">
                    Last: Block {lastCheckin.toString()}
                </span>
                <span className="countdown-bar__label">
                    {isExpired
                        ? 'EXPIRED'
                        : `Deadline: Block ${deadline.toString()}`}
                </span>
            </div>
        </div>
    );
}
