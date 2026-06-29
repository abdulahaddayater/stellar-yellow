import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider, useWallet } from "./contexts/WalletContext";
import WalletSelector from "./components/WalletSelector";
import TransactionStatus from "./components/TransactionStatus";
import AppLayout from "./components/layout/AppLayout";
import PollPage from "./pages/PollPage";
import LiveFeedPage from "./pages/LiveFeedPage";
import TransactionsPage from "./pages/TransactionsPage";
import SettingsPage from "./pages/SettingsPage";
import { CONFIG } from "./config";
import {
  prepareVoteTransaction,
  submitContractTransaction,
  pollTransactionStatus,
} from "./services/transactionService";
import useTransactionState, { TX_STATES } from "./hooks/useTransactionState";
import { usePollData } from "./hooks/usePollData";
import { useVoteTransactions } from "./hooks/useVoteTransactions";
import { handleTransactionError } from "./utils/errorHandler";
import "./App.css";

function AppContent() {
  const { address, isConnected, signTransaction, refreshBalance } = useWallet();

  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [txFilter, setTxFilter] = useState("all");
  const {
    question,
    options,
    totalVotes,
    userVote,
    hasVoted,
    isLoading,
    liveEvents,
    refetch,
  } = usePollData(address);

  const {
    transactions: voteTransactions,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useVoteTransactions(address, txFilter);

  const {
    state: transactionState,
    error: transactionError,
    txHash: transactionHash,
    startTime: transactionStartTime,
    isProcessing,
    executeTransaction,
    updateState,
  } = useTransactionState({
    onSuccess: async () => {
      await Promise.all([refreshBalance(), refetch(), refetchTransactions()]);
    },
    timeout: 60000,
    autoResetDelay: 4000,
  });

  const handleVote = async (optionId) => {
    if (hasVoted || isProcessing) return;

    await executeTransaction(async (abortSignal) => {
      try {
        updateState(TX_STATES.SIGNING);
        const contractTx = await prepareVoteTransaction(address, optionId);

        if (abortSignal.aborted) {
          throw new Error("Transaction aborted");
        }

        const signedContractXdr = await signTransaction(contractTx.xdr);

        if (abortSignal.aborted) {
          throw new Error("Transaction aborted");
        }

        updateState(TX_STATES.SUBMITTING);
        const submitResult = await submitContractTransaction(signedContractXdr);

        updateState(TX_STATES.CONFIRMING);
        const pollResult = await pollTransactionStatus(submitResult.hash, abortSignal);

        if (pollResult.success) {
          return { hash: submitResult.hash, result: pollResult };
        }

        const failMsg =
          typeof pollResult.error === "string"
            ? pollResult.error
            : pollResult.error?.message || "Vote transaction failed on-chain";
        throw new Error(failMsg);
      } catch (err) {
        const parsed = handleTransactionError(err);
        throw new Error(parsed.message);
      }
    });
  };

  const displayError = transactionError;

  if (!isConnected) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">🗳️</span>
              <h1>Stellar Live Poll</h1>
            </div>
            <div className="header-info">
              <span className="badge badge-info">
                Contract: {CONFIG.CONTRACT_ID.slice(0, 8)}...
              </span>
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="connect-container">
            <div className="hero glass-card">
              <h2 className="hero-title">Vote on Stellar, Live</h2>
              <p className="hero-subtitle">
                Cast your vote on-chain and watch results update in real time
                via Soroban contract events
              </p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">🔐</span>
                  <span>Multi-Wallet Support</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📡</span>
                  <span>Real-Time Events</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">⛓️</span>
                  <span>On-Chain Votes</span>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setShowWalletSelector(true)}
              >
                Connect Wallet to Vote
              </button>
            </div>
          </div>
        </main>

        <WalletSelector
          isOpen={showWalletSelector}
          onClose={() => setShowWalletSelector(false)}
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout
              address={address}
              onReconnect={() => setShowWalletSelector(true)}
            />
          }
        >
          <Route
            index
            element={
              <PollPage
                question={question}
                options={options}
                totalVotes={totalVotes}
                userVote={userVote}
                hasVoted={hasVoted}
                isLoading={isLoading}
                isVoting={isProcessing}
                onVote={handleVote}
              />
            }
          />
          <Route
            path="live"
            element={
              <LiveFeedPage
                liveEvents={liveEvents}
                totalVotes={totalVotes}
              />
            }
          />
          <Route
            path="transactions"
            element={
              <TransactionsPage
                transactions={voteTransactions}
                connectedWallet={address}
                isLoading={isLoadingTransactions}
                filter={txFilter}
                onFilterChange={setTxFilter}
              />
            }
          />
          <Route
            path="settings"
            element={
              <SettingsPage
                onReconnect={() => setShowWalletSelector(true)}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
      />

      {transactionState !== "idle" && (
        <div className="floating-status">
          <TransactionStatus
            status={transactionState}
            hash={transactionHash}
            error={displayError}
            startTime={transactionStartTime}
          />
        </div>
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
