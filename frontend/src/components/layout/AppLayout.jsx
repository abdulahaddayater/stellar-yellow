import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useIsMobile } from '../../hooks/useMediaQuery';
import './AppLayout.css';

export default function AppLayout({ address, onReconnect }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    return (
        <div className="app-layout">
            {isMobile && isMobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="app-content">
                <TopBar
                    address={address}
                    onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    onReconnect={onReconnect}
                />

                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
