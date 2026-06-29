import React from 'react';
import './PollPage.css';

export default function PollPage({
    question,
    options,
    totalVotes,
    userVote,
    hasVoted,
    isLoading,
    isVoting,
    onVote,
}) {
    return (
        <div className="poll-page">
            <section className="poll-hero">
                <div className="poll-hero-badge">
                    <span className="live-dot" />
                    Live Poll
                </div>
                <h1 className="poll-question">{question}</h1>
                <p className="poll-meta">
                    {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast on Stellar testnet
                    {hasVoted && userVote > 0 && (
                        <span className="voted-badge">You voted for option {userVote}</span>
                    )}
                </p>
            </section>

            <section className="poll-results glass-card">
                <h2 className="section-title">Results</h2>

                {isLoading ? (
                    <div className="poll-skeleton">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="skeleton-option" />
                        ))}
                    </div>
                ) : (
                    <div className="results-list">
                        {options.map((opt) => {
                            const isSelected = userVote === opt.id;
                            const isLeading =
                                totalVotes > 0 &&
                                opt.votes === Math.max(...options.map((o) => o.votes)) &&
                                opt.votes > 0;

                            return (
                                <div
                                    key={opt.id}
                                    className={`result-row ${isSelected ? 'selected' : ''} ${isLeading ? 'leading' : ''}`}
                                >
                                    <div className="result-header">
                                        <span className="option-icon">{opt.icon}</span>
                                        <span className="option-label">{opt.label}</span>
                                        <span className="option-stats">
                                            {opt.votes} ({opt.percentage}%)
                                        </span>
                                    </div>
                                    <div className="result-bar-track">
                                        <div
                                            className="result-bar-fill"
                                            style={{
                                                width: `${opt.percentage}%`,
                                                backgroundColor: opt.color,
                                            }}
                                        />
                                    </div>
                                    {!hasVoted && (
                                        <button
                                            className="vote-btn"
                                            style={{ borderColor: opt.color, color: opt.color }}
                                            onClick={() => onVote(opt.id)}
                                            disabled={isVoting}
                                        >
                                            {isVoting ? 'Submitting...' : 'Vote'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasVoted && (
                    <p className="already-voted-note">
                        Thanks for voting! Results update in real time as others cast their votes.
                    </p>
                )}
            </section>
        </div>
    );
}
