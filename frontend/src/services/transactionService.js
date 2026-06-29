import { CONFIG } from "../config";

/**
 * Prepare a cast_vote contract transaction (calls backend)
 */
export async function prepareVoteTransaction(from, option) {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/prepare-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, option: parseInt(option, 10) }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw error;
    }

    return await response.json();
}

/**
 * Submit signed contract transaction (calls backend)
 */
export async function submitContractTransaction(signedXdr) {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/submit-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw error;
    }

    return await response.json();
}

/**
 * Poll transaction status
 */
export async function getTransactionStatus(hash) {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/transaction-status/${hash}`);

    if (!response.ok) {
        throw new Error("Failed to fetch transaction status");
    }

    return await response.json();
}

/**
 * Poll until transaction is confirmed
 */
export async function pollTransactionStatus(hash, abortSignal = null, maxAttempts = 30, interval = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
        if (abortSignal?.aborted) {
            throw new Error("Transaction polling cancelled");
        }

        const status = await getTransactionStatus(hash);

        if (status.status === "SUCCESS") {
            return { success: true, result: status };
        }

        if (status.status === "FAILED") {
            return { success: false, error: status.error };
        }

        if (status.status === "TIMEOUT") {
            return { success: false, error: "Transaction timeout" };
        }

        await new Promise((resolve) => setTimeout(resolve, interval));

        if (abortSignal?.aborted) {
            throw new Error("Transaction polling cancelled");
        }
    }

    return { success: false, error: "Polling timeout" };
}

/**
 * Fetch poll results via backend (optional fallback)
 */
export async function fetchPollResultsFromBackend(walletAddress) {
    const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/poll/results?wallet=${encodeURIComponent(walletAddress)}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch poll results");
    }

    return await response.json();
}
