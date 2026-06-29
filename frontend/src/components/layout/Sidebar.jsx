import React from 'react';
import { NavLink } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useMediaQuery';
import './Sidebar.css';

export default function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) {
    const isMobile = useIsMobile();

    const navItems = [
        { path: '/', icon: '🗳️', label: 'Poll', exact: true },
        { path: '/live', icon: '📡', label: 'Live Feed' },
        { path: '/transactions', icon: '📋', label: 'Transactions' },
        { path: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    const handleNavClick = () => {
        if (isMobile) {
            onMobileClose();
        }
    };

    const sidebarClasses = [
        'sidebar',
        isCollapsed ? 'collapsed' : '',
        isMobile && isMobileOpen ? 'mobile-open' : ''
    ].filter(Boolean).join(' ');

    return (
        <aside className={sidebarClasses}>
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">🗳️</span>
                    {!isCollapsed && <span className="logo-text">Live Poll</span>}
                </div>

                {!isMobile && (
                    <button
                        className="collapse-btn"
                        onClick={onToggle}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? '→' : '←'}
                    </button>
                )}

                {isMobile && (
                    <button
                        className="mobile-close-btn"
                        onClick={onMobileClose}
                        title="Close menu"
                    >
                        ✕
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                        onClick={handleNavClick}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {!isCollapsed && (
                <div className="sidebar-footer">
                    <div className="footer-item">
                        <span className="footer-label">Network</span>
                        <span className="footer-value">Testnet</span>
                    </div>
                </div>
            )}
        </aside>
    );
}
