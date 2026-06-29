import React, { useState } from "react";
import { CONFIG } from "../config";
import { truncateAddress, formatTimestamp } from "../utils/errorHandler";
import { getOptionMeta } from "../constants/poll";
import "./VoteTransactionList.css";

export default function VoteTransactionList({
    transactions = [],
    connectedWallet,
    isLoading = false,
}) {
    const [expandedId, setExpandedId] = useState(null);
    const [copiedHash, setCopiedHash] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedHash(text);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="vote-tx-list">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="vote-tx-item skeleton" />
                ))}
            </div>
        );
    }

    if (!transactions.length) {
        return (
            <div className="vote-tx-list">
                <div className="vote-tx-empty glass-card">
                    <span className="empty-icon">📭</span>
                    <p className="empty-text">No vote transactions yet</p>
                    <p className="empty-subtext">
                        Cast a vote on the Poll page to see on-chain activity here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="vote-tx-list">
            {transactions.map((tx) => {
                const isExpanded = expandedId === tx.id;
                const isMine = connectedWallet && tx.voter === connectedWallet;
                const optionMeta = getOptionMeta(tx.option);

                return (
                    <div
                        key={tx.id}
                        className={`vote-tx-item glass-card ${isExpanded ? "expanded" : ""} ${isMine ? "mine" : ""}`}
                    >
                        <button
                            type="button"
                            className="vote-tx-summary"
                            onClick={() => toggleExpand(tx.id)}
                        >
                            <div className="vote-tx-icon">{optionMeta?.icon || "🗳️"}</div>

                            <div className="vote-tx-info">
                                <span className="vote-tx-title">
                                    Vote cast for {tx.optionLabel || `Option ${tx.option}`}
                                </span>
                                <span className="vote-tx-voter">
                                    {isMine ? "You" : truncateAddress(tx.voter)}
                                    {isMine && (
                                        <span className="mine-badge">Your vote</span>
                                    )}
                                </span>
                            </div>

                            <div className="vote-tx-meta">
                                <span className="vote-tx-time">{formatTimestamp(tx.timestamp)}</span>
                                <span className={`vote-tx-status ${tx.successful ? "success" : "failed"}`}>
                                    {tx.successful ? "✓ Success" : "✗ Failed"}
                                </span>
                            </div>

                            <span className={`chevron ${isExpanded ? "expanded" : ""}`}>▼</span>
                        </button>

                        {isExpanded && (
                            <div className="vote-tx-details">
                                <div className="detail-row">
                                    <span className="detail-label">Voter</span>
                                    <span className="detail-value mono">{tx.voter}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Option</span>
                                    <span className="detail-value">
                                        {optionMeta?.icon} {tx.optionLabel}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Ledger</span>
                                    <span className="detail-value mono">#{tx.ledger}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Total votes after</span>
                                    <span className="detail-value">{tx.totalVotes}</span>
                                </div>
                                {tx.hash && (
                                    <div className="detail-row">
                                        <span className="detail-label">Tx Hash</span>
                                        <span className="detail-value hash-row">
                                            <span className="mono">{truncateAddress(tx.hash, 8)}</span>
                                            <button
                                                type="button"
                                                className="copy-btn-sm"
                                                onClick={() => handleCopy(tx.hash)}
                                            >
                                                {copiedHash === tx.hash ? "Copied!" : "Copy"}
                                            </button>
                                        </span>
                                    </div>
                                )}
                                {tx.hash && (
                                    <a
                                        href={`${CONFIG.STELLAR_EXPERT_URL}/tx/${tx.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="explorer-link"
                                    >
                                        View on Stellar Expert →
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
