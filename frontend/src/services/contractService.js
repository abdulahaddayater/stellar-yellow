import { CONFIG } from "../config";
import { DEFAULT_QUESTION, POLL_OPTIONS } from "../constants/poll";
import {
    Contract,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    Account,
    Address,
    nativeToScVal,
    scValToNative,
} from "@stellar/stellar-sdk";
import { Server as SorobanServer } from "@stellar/stellar-sdk/rpc";

let sorobanServerInstance = null;
const getSorobanServer = () => {
    if (!sorobanServerInstance) {
        sorobanServerInstance = new SorobanServer(CONFIG.SOROBAN_RPC_URL);
    }
    return sorobanServerInstance;
};

async function getSimulationAccount(walletAddress) {
    const response = await fetch(`${CONFIG.HORIZON_URL}/accounts/${walletAddress}`);
    if (!response.ok) {
        throw new Error(`Account not found: ${walletAddress}`);
    }
    const accountData = await response.json();
    return new Account(accountData.account_id, accountData.sequence);
}

async function simulateContractCall(walletAddress, operationBuilder) {
    const sourceAccount = await getSimulationAccount(walletAddress);
    const contract = new Contract(CONFIG.CONTRACT_ID);

    const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    })
        .addOperation(operationBuilder(contract))
        .setTimeout(30)
        .build();

    return getSorobanServer().simulateTransaction(transaction);
}

function parseU32(simulation) {
    if (simulation.result?.retval) {
        return Number(simulation.result.retval.value());
    }
    return 0;
}

/**
 * Fetch full poll results from the contract
 */
export async function getPollResults(walletAddress) {
    if (!walletAddress) {
        return {
            question: DEFAULT_QUESTION,
            options: POLL_OPTIONS.map((opt) => ({ ...opt, votes: 0, percentage: 0 })),
            totalVotes: 0,
            userVote: 0,
            hasVoted: false,
        };
    }

    try {
        const questionSim = await simulateContractCall(walletAddress, (c) => c.call("get_question"));
        const question = questionSim.result?.retval
            ? scValToNative(questionSim.result.retval) || DEFAULT_QUESTION
            : DEFAULT_QUESTION;

        const totalSim = await simulateContractCall(walletAddress, (c) => c.call("get_total_votes"));
        const totalVotes = parseU32(totalSim);

        const hasVotedSim = await simulateContractCall(walletAddress, (c) =>
            c.call("has_voted", Address.fromString(walletAddress).toScVal())
        );
        const hasVoted = hasVotedSim.result?.retval
            ? scValToNative(hasVotedSim.result.retval) === true
            : false;

        let userVote = 0;
        if (hasVoted) {
            const userVoteSim = await simulateContractCall(walletAddress, (c) =>
                c.call("get_user_vote", Address.fromString(walletAddress).toScVal())
            );
            userVote = parseU32(userVoteSim);
        }

        const options = await Promise.all(
            POLL_OPTIONS.map(async (opt) => {
                const countSim = await simulateContractCall(walletAddress, (c) =>
                    c.call("get_vote_count", nativeToScVal(opt.id, { type: "u32" }))
                );
                const votes = parseU32(countSim);
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                return { ...opt, votes, percentage };
            })
        );

        return { question, options, totalVotes, userVote, hasVoted };
    } catch (error) {
        console.error("Failed to get poll results:", error);
        return {
            question: DEFAULT_QUESTION,
            options: POLL_OPTIONS.map((opt) => ({ ...opt, votes: 0, percentage: 0 })),
            totalVotes: 0,
            userVote: 0,
            hasVoted: false,
            error: error.message,
        };
    }
}

export { getSorobanServer };
