import { useState, useEffect, useCallback, useRef } from "react";
import { getPollResults } from "../services/contractService";
import eventService from "../services/eventService";

/**
 * Hook for poll data with real-time event refresh
 */
export function usePollData(walletAddress) {
    const [pollData, setPollData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [liveEvents, setLiveEvents] = useState([]);
    const abortRef = useRef(null);

    const fetchPoll = useCallback(async (force = false) => {
        if (!walletAddress) {
            setPollData(null);
            setIsLoading(false);
            return;
        }

        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            const data = await getPollResults(walletAddress);
            setPollData(data);
            if (data.error) {
                setError(new Error(data.error));
            }
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        fetchPoll();
    }, [fetchPoll]);

    // Real-time event integration
    useEffect(() => {
        if (!walletAddress) return;

        const handleEvent = (eventData) => {
            setLiveEvents((prev) => [
                {
                    id: `${eventData.ledger}-${eventData.id}-${Date.now()}`,
                    ledger: eventData.ledger,
                    topic: eventData.topic,
                    value: eventData.value,
                    timestamp: Date.now(),
                },
                ...prev.slice(0, 49),
            ]);
            fetchPoll(true);
        };

        eventService.connect(handleEvent);
        eventService.addEventListener(handleEvent);

        return () => {
            eventService.removeEventListener(handleEvent);
        };
    }, [walletAddress, fetchPoll]);

    return {
        pollData,
        question: pollData?.question,
        options: pollData?.options ?? [],
        totalVotes: pollData?.totalVotes ?? 0,
        userVote: pollData?.userVote ?? 0,
        hasVoted: pollData?.hasVoted ?? false,
        isLoading,
        error,
        liveEvents,
        refetch: () => fetchPoll(true),
    };
}
