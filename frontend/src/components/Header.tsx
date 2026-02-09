import { Link, useLocation } from 'react-router-dom';
import { WalletButton } from './WalletButton.js';

/**
 * Application header with navigation and wallet connection.
 */
export function Header(): React.JSX.Element {
    const location = useLocation();

    const isActive = (path: string): string => {
        return location.pathname === path ? 'nav-link nav-link--active' : 'nav-link';
    };

    return (
        <header className="header">
            <div className="header__inner">
                <Link to="/" className="header__brand">
                    <span className="header__logo">opSwitch</span>
                </Link>
                <nav className="header__nav">
                    <Link to="/" className={isActive('/')}>
                        My Switches
                    </Link>
                    <Link to="/create" className={isActive('/create')}>
                        Create
                    </Link>
                </nav>
                <WalletButton />
            </div>
        </header>
    );
}
