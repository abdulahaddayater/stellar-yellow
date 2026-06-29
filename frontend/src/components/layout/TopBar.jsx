import React from 'react';
import { truncateAddress } from '../../utils/errorHandler';
import { useIsMobile } from '../../hooks/useMediaQuery';
import './TopBar.css';

export default function TopBar({ address, onMenuToggle, onReconnect }) {
    const isMobile = useIsMobile();

    return (
        <header className="topbar">
            <div className="topbar-left">
                {isMobile && (
                    <button
                        className="hamburger-btn"
                        onClick={onMenuToggle}
                        aria-label="Open menu"
                    >
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                    </button>
                )}

                <div className="network-badge">
                    <span className="network-dot"></span>
                    <span className="network-label">Testnet</span>
                </div>

                <div className="live-indicator">
                    <span className="live-dot"></span>
                    <span className="live-label">Live</span>
                </div>
            </div>

            <div className="topbar-right">
                <button className="btn btn-secondary switch-wallet-btn" onClick={onReconnect}>
                    <span className="hide-mobile">Switch Wallet</span>
                    <span className="hide-desktop">↻</span>
                </button>

                {address && (
                    <div className="user-address">
                        <span className="address-icon">👤</span>
                        <span className="address-text">{truncateAddress(address)}</span>
                    </div>
                )}
            </div>
        </header>
    );
}
