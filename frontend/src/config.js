// Application configuration
// NOTE: Deploy the Live Poll contract and update CONTRACT_ID after deployment
export const CONFIG = {
    CONTRACT_ID: import.meta.env.VITE_CONTRACT_ID || "CDOCHIFTGNVVDMMELB6VRIBYIA265SIQMIRM36BP3MPYMWQCRWUIWZZV",
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "https://stellar-yellow-abd-backend.vercel.app",
    NETWORK: import.meta.env.VITE_NETWORK || "TESTNET",
    HORIZON_URL: "https://horizon-testnet.stellar.org",
    SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
    STELLAR_EXPERT_URL: "https://stellar.expert/explorer/testnet",
};

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
