/** Poll option labels — must match contract option indices 1–4 */
export const POLL_OPTIONS = [
    { id: 1, label: "Smart Contracts (Soroban)", icon: "⚡", color: "#6366F1" },
    { id: 2, label: "Asset Issuance", icon: "🪙", color: "#F59E0B" },
    { id: 3, label: "DEX & Trading", icon: "📈", color: "#10B981" },
    { id: 4, label: "Cross-border Payments", icon: "🌍", color: "#EC4899" },
];

export const DEFAULT_QUESTION = "Which Stellar feature excites you most?";

export function getOptionLabel(optionId) {
    const opt = POLL_OPTIONS.find((o) => o.id === optionId);
    return opt ? opt.label : `Option ${optionId}`;
}

export function getOptionMeta(optionId) {
    return POLL_OPTIONS.find((o) => o.id === optionId) || null;
}
