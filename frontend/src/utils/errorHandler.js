// Error handling utilities

export const ErrorCodes = {
    WALLET_NOT_INSTALLED: "WALLET_NOT_INSTALLED",
    WALLET_REJECTED: "WALLET_REJECTED",
    INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
    ALREADY_VOTED: "ALREADY_VOTED",
    INVALID_OPTION: "INVALID_OPTION",
    SIMULATION_FAILED: "SIMULATION_FAILED",
    NETWORK_MISMATCH: "NETWORK_MISMATCH",
    INVALID_ADDRESS: "INVALID_ADDRESS",
    CONTRACT_ERROR: "CONTRACT_ERROR",
    BACKEND_ERROR: "BACKEND_ERROR",
    TIMEOUT: "TIMEOUT",
    UNKNOWN: "UNKNOWN",
};

export const ErrorMessages = {
    [ErrorCodes.WALLET_NOT_INSTALLED]: (wallet) =>
        `${wallet} wallet is not installed. Please install it from the official website.`,
    [ErrorCodes.WALLET_REJECTED]: () =>
        "Transaction was rejected. Please try again.",
    [ErrorCodes.INSUFFICIENT_BALANCE]: (needed, available) =>
        `Insufficient XLM balance. Need ${needed} XLM, but only ${available} XLM available.`,
    [ErrorCodes.ALREADY_VOTED]: () =>
        "You have already voted in this poll. Each wallet can only vote once.",
    [ErrorCodes.INVALID_OPTION]: () =>
        "Invalid poll option selected. Please choose a valid option.",
    [ErrorCodes.SIMULATION_FAILED]: (reason) =>
        `Contract simulation failed: ${reason || "Unknown error"}`,
    [ErrorCodes.NETWORK_MISMATCH]: () =>
        "Please switch your wallet to Stellar Testnet.",
    [ErrorCodes.INVALID_ADDRESS]: () =>
        "Invalid Stellar address. Address must start with 'G' and be 56 characters long.",
    [ErrorCodes.CONTRACT_ERROR]: (message) =>
        `Smart contract error: ${message}`,
    [ErrorCodes.BACKEND_ERROR]: () =>
        "Server error occurred. Please try again in a moment.",
    [ErrorCodes.TIMEOUT]: () =>
        "Transaction is taking longer than expected. Check Stellar Expert for status.",
    [ErrorCodes.UNKNOWN]: () =>
        "An unexpected error occurred. Please try again.",
};

/**
 * Parse error and return user-friendly message
 */
export function handleTransactionError(error) {
    console.error("Transaction error:", error);

    // Already voted (contract error)
    if (
        error.message?.includes("AlreadyVoted") ||
        error.message?.includes("Already voted") ||
        error.error?.details?.includes("AlreadyVoted")
    ) {
        return {
            code: ErrorCodes.ALREADY_VOTED,
            message: ErrorMessages[ErrorCodes.ALREADY_VOTED](),
            recoverable: false,
        };
    }

    // Invalid option
    if (error.message?.includes("InvalidOption")) {
        return {
            code: ErrorCodes.INVALID_OPTION,
            message: ErrorMessages[ErrorCodes.INVALID_OPTION](),
            recoverable: true,
        };
    }

    // Wallet rejection
    if (error.message?.includes("User declined") || error.message?.includes("rejected")) {
        return {
            code: ErrorCodes.WALLET_REJECTED,
            message: ErrorMessages[ErrorCodes.WALLET_REJECTED](),
            recoverable: true,
        };
    }

    // Invalid address
    if (error.message?.includes("invalid") && error.message?.includes("address")) {
        return {
            code: ErrorCodes.INVALID_ADDRESS,
            message: ErrorMessages[ErrorCodes.INVALID_ADDRESS](),
            recoverable: true,
        };
    }

    // Network mismatch
    if (error.message?.includes("network")) {
        return {
            code: ErrorCodes.NETWORK_MISMATCH,
            message: ErrorMessages[ErrorCodes.NETWORK_MISMATCH](),
            recoverable: true,
        };
    }

    // Backend error with error code
    if (error.error?.code) {
        return {
            code: error.error.code,
            message: error.error.message,
            details: error.error.details,
            recoverable: true,
        };
    }

    // Generic error
    return {
        code: ErrorCodes.UNKNOWN,
        message: error.message || ErrorMessages[ErrorCodes.UNKNOWN](),
        recoverable: true,
    };
}

/**
 * Validate Stellar address
 */
export function isValidStellarAddress(address) {
    return (
        typeof address === "string" &&
        address.length === 56 &&
        address.startsWith("G")
    );
}

/**
 * Truncate address for display
 */
export function truncateAddress(address, start = 4, end = 4) {
    if (!address || address.length < start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format XLM amount
 */
export function formatXLM(amount, decimals = 2) {
    // Handle null, undefined, or non-numeric values
    if (amount === null || amount === undefined || isNaN(amount)) {
        return `0.${'0'.repeat(decimals)} XLM`;
    }

    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })} XLM`;
}

/**
 * Format timestamp — accepts ISO strings, Unix seconds, or milliseconds
 */
export function formatTimestamp(value) {
    if (value == null || value === "") {
        return "—";
    }

    let date;

    if (value instanceof Date) {
        date = value;
    } else if (typeof value === "string") {
        date = new Date(value);
    } else if (typeof value === "number") {
        // Values >= 1e12 are milliseconds; smaller values are Unix seconds
        date = new Date(value >= 1e12 ? value : value * 1000);
    } else {
        return "—";
    }

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    const now = Date.now();
    const diff = now - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
}
