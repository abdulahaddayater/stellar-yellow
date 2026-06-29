// Application configuration
const PRODUCTION_BACKEND_URL = "https://stellar-yellow-abd-backend.vercel.app";

function resolveBackendUrl() {
    const envUrl = import.meta.env.VITE_BACKEND_URL;

    // Production must never call localhost
    if (import.meta.env.PROD) {
        if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
            return PRODUCTION_BACKEND_URL;
        }
        return envUrl.replace(/\/$/, "");
    }

    // Local dev: use .env.local or fallback to localhost backend
    return (envUrl || "http://localhost:4000").replace(/\/$/, "");
}

export const CONFIG = {
    CONTRACT_ID: import.meta.env.VITE_CONTRACT_ID || "CDOCHIFTGNVVDMMELB6VRIBYIA265SIQMIRM36BP3MPYMWQCRWUIWZZV",
    BACKEND_URL: resolveBackendUrl(),
    NETWORK: import.meta.env.VITE_NETWORK || "TESTNET",
    HORIZON_URL: "https://horizon-testnet.stellar.org",
    SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
    STELLAR_EXPERT_URL: "https://stellar.expert/explorer/testnet",
};

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
