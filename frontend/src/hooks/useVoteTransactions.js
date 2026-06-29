import { useState, useEffect, useCallback, useRef } from "react";
import { fetchVoteTransactions } from "../services/voteTransactionService";
import eventService from "../services/eventService";

/**
 * Hook for fetching and refreshing vote transaction history
 */
export function useVoteTransactions(walletAddress, filter = "all") {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);

    const load = useCallback(async () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            const wallet = filter === "mine" && walletAddress ? walletAddress : null;
            const data = await fetchVoteTransactions({
                limit: 50,
                wallet,
                signal: abortRef.current.signal,
            });
            setTransactions(data);
        } catch (err) {
            if (err.name !== "AbortError") {
                setError(err);
            }
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress, filter]);

    useEffect(() => {
        load();
    }, [load]);

    // Refresh when new vote events arrive
    useEffect(() => {
        const handleEvent = () => load();
        eventService.connect(handleEvent);
        eventService.addEventListener(handleEvent);
        return () => eventService.removeEventListener(handleEvent);
    }, [load]);

    return {
        transactions,
        isLoading,
        error,
        refetch: load,
    };
}
