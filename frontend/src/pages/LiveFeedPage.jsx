import React from 'react';
import { formatTimestamp } from '../utils/errorHandler';
import './LiveFeedPage.css';

export default function LiveFeedPage({ liveEvents, totalVotes }) {
    return (
        <div className="live-feed-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Live Activity</h1>
                    <p className="page-subtitle">
                        Real-time vote events streamed from the Soroban contract
                    </p>
                </div>
                <div className="feed-stats glass-card">
                    <span className="stat-value">{totalVotes}</span>
                    <span className="stat-label">Total Votes</span>
                </div>
            </div>

            <section className="feed-section glass-card">
                <div className="feed-header">
                    <span className="live-dot" />
                    <h2>Event Stream</h2>
                    <span className="event-count">{liveEvents.length} events</span>
                </div>

                {liveEvents.length === 0 ? (
                    <div className="empty-feed">
                        <div className="empty-icon">📡</div>
                        <p>Waiting for vote events...</p>
                        <p className="empty-hint">
                            Cast a vote on the Poll page to see live updates here
                        </p>
                    </div>
                ) : (
                    <ul className="event-list">
                        {liveEvents.map((event) => (
                            <li key={event.id} className="event-item">
                                <div className="event-icon">🗳️</div>
                                <div className="event-body">
                                    <p className="event-title">New vote recorded on-chain</p>
                                    <p className="event-detail">
                                        Ledger {event.ledger} · Contract event
                                    </p>
                                </div>
                                <span className="event-time">
                                    {formatTimestamp(event.timestamp)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="info-section glass-card">
                <h3>How it works</h3>
                <ul>
                    <li>Each vote calls the <code>cast_vote</code> Soroban contract function</li>
                    <li>The contract emits a <code>vote</code> event with voter, option, and timestamp</li>
                    <li>Events are streamed via Server-Sent Events from the backend</li>
                    <li>Results refresh automatically when new votes arrive</li>
                </ul>
            </section>
        </div>
    );
}
