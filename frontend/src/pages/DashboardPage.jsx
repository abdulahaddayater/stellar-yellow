import React from 'react';
import { Link } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { usePaymentAnalytics } from '../hooks/usePaymentAnalytics';
import { formatXLM, formatTimestamp } from '../utils/errorHandler';
import './DashboardPage.css';

function truncateAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function DashboardPage({ payments, connectedWallet, balance, isLoading }) {
    const analytics = usePaymentAnalytics(payments, connectedWallet);
    const recentTransactions = payments.slice(0, 5);

    return (
        <div className="dashboard-page">
            {/* Hero Banner */}
            <section className="dashboard-hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <span className="hero-eyebrow">Payment Tracker</span>
                        <h1 className="hero-title">Your Dashboard</h1>
                        <p className="hero-subtitle">
                            Track sent & received XLM across Stellar testnet in real time
                        </p>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat-pill">
                            <span className="stat-label">Wallet</span>
                            <span className="stat-value mono">{truncateAddress(connectedWallet)}</span>
                        </div>
                        <div className="hero-stat-pill highlight">
                            <span className="stat-label">Balance</span>
                            <span className="stat-value mono">{formatXLM(balance ?? 0)}</span>
                        </div>
                        <div className="hero-stat-pill">
                            <span className="stat-label">Transactions</span>
                            <span className="stat-value">{analytics?.transactionCount ?? 0}</span>
                        </div>
                    </div>
                </div>
                <div className="hero-decoration" aria-hidden="true">
                    <div className="hero-orb hero-orb-1" />
                    <div className="hero-orb hero-orb-2" />
                </div>
            </section>

            {/* Analytics Metrics */}
            <AnalyticsDashboard analytics={analytics} />

            {/* Recent Transactions */}
            <section className="recent-section">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Recent Activity</h2>
                        <p className="section-desc">Your latest on-chain payments</p>
                    </div>
                    <Link to="/transactions" className="view-all-link">
                        View all
                        <span className="arrow">→</span>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="skeleton-list">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="skeleton-item" />
                        ))}
                    </div>
                ) : recentTransactions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💸</div>
                        <p className="empty-text">No transactions yet</p>
                        <p className="empty-subtext">Send your first payment to see activity here</p>
                    </div>
                ) : (
                    <div className="recent-list">
                        {recentTransactions.map((tx) => (
                            <div
                                key={tx.id}
                                className={`recent-item ${tx.direction}`}
                            >
                                <div className={`tx-avatar ${tx.direction}`}>
                                    {tx.direction === 'sent' ? '↑' : '↓'}
                                </div>
                                <div className="tx-info">
                                    <span className="tx-counterparty">
                                        {tx.direction === 'sent' ? 'To' : 'From'}{' '}
                                        <strong>{truncateAddress(tx.direction === 'sent' ? tx.to : tx.from)}</strong>
                                    </span>
                                    <span className="tx-time">{formatTimestamp(tx.timestamp ?? tx.created_at)}</span>
                                </div>
                                <div className="tx-meta">
                                    <span className={`direction-badge ${tx.direction}`}>
                                        {tx.direction === 'sent' ? 'Sent' : 'Received'}
                                    </span>
                                    <span className={`amount ${tx.direction}`}>
                                        {tx.direction === 'sent' ? '−' : '+'}{formatXLM(tx.amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
