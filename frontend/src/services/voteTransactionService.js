import { CONFIG } from "../config";

/**
 * Fetch recent vote transactions from the backend
 */
export async function fetchVoteTransactions(options = {}) {
    const { limit = 50, wallet = null, signal } = options;

    const params = new URLSearchParams({ limit: String(limit) });
    if (wallet) {
        params.set("wallet", wallet);
    }

    const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/vote-transactions?${params}`,
        { signal }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch vote transactions");
    }

    const data = await response.json();
    return data.transactions || [];
}
