import React from 'react';
import VoteTransactionList from '../components/VoteTransactionList';
import './TransactionsPage.css';

export default function TransactionsPage({
    transactions,
    connectedWallet,
    isLoading,
    onFilterChange,
    filter,
}) {
    return (
        <div className="transactions-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transactions</h1>
                    <p className="page-subtitle">
                        Recent on-chain vote transactions from the Live Poll contract
                    </p>
                </div>
                <div className="tx-filter-tabs">
                    <button
                        type="button"
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => onFilterChange('all')}
                    >
                        All Votes
                    </button>
                    <button
                        type="button"
                        className={`filter-tab ${filter === 'mine' ? 'active' : ''}`}
                        onClick={() => onFilterChange('mine')}
                    >
                        My Votes
                    </button>
                </div>
            </div>

            <div className="tx-count-bar">
                <span>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
            </div>

            <VoteTransactionList
                transactions={transactions}
                connectedWallet={connectedWallet}
                isLoading={isLoading}
            />
        </div>
    );
}
