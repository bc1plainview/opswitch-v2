import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header.js';
import { Dashboard } from './pages/Dashboard.js';
import { CreateSwitch } from './pages/CreateSwitch.js';
import { SwitchDetail } from './pages/SwitchDetail.js';

/**
 * Root application component.
 * Uses HashRouter for IPFS compatibility.
 */
export function App(): React.JSX.Element {
    return (
        <HashRouter>
            <div className="app-layout">
                <Header />
                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/create" element={<CreateSwitch />} />
                        <Route path="/switch/:id" element={<SwitchDetail />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
}
