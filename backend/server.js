import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import NodeCache from "node-cache";
import {
  rpc,
  Contract,
  Networks,
  TransactionBuilder,
  Account,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";

const app = express();

const ALLOWED_ORIGINS = [
  "https://stellar-yellow-abd.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(bodyParser.json());

// Configuration
const CONTRACT_ID = process.env.CONTRACT_ID || "CDOCHIFTGNVVDMMELB6VRIBYIA265SIQMIRM36BP3MPYMWQCRWUIWZZV";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

const sorobanServer = new rpc.Server(SOROBAN_RPC_URL);

// Cache for transaction status (TTL: 5 minutes)
const txCache = new NodeCache({ stdTTL: 300 });

// Error codes
const ErrorCodes = {
  SIMULATION_FAILED: "SIMULATION_FAILED",
  INSUFFICIENT_AUTH: "INSUFFICIENT_AUTH",
  INVALID_PARAMS: "INVALID_PARAMS",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  NETWORK_ERROR: "NETWORK_ERROR",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  TIMEOUT: "TIMEOUT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Poll transaction status until confirmed or timeout
 */
async function pollTransactionStatus(hash, maxAttempts = 30, interval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await sorobanServer.getTransaction(hash);

      if (response.status === "SUCCESS") {
        return {
          status: "SUCCESS",
          result: response,
          ledger: response.ledger,
        };
      }

      if (response.status === "FAILED") {
        return {
          status: "FAILED",
          error: response.resultXdr,
          resultMetaXdr: response.resultMetaXdr,
        };
      }

      // Still pending, wait and try again
      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch (error) {
      console.error(`Polling attempt ${i + 1} failed:`, error.message);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  return { status: "TIMEOUT" };
}

/**
 * Fetch account from Horizon
 */
async function getAccount(publicKey) {
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!response.ok) {
      throw new Error(`Account not found: ${publicKey}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch account: ${error.message}`);
  }
}

/**
 * Build error response
 */
function errorResponse(code, message, details = null) {
  const response = { error: { code, message } };
  if (details) {
    response.error.details = details;
  }
  return response;
}

// ==================== API ENDPOINTS ====================

/**
 * Simulate a read-only contract call
 */
async function simulateReadCall(walletAddress, buildOperation) {
  const accountData = await getAccount(walletAddress);
  const sourceAccount = new Account(accountData.account_id, accountData.sequence);
  const contract = new Contract(CONTRACT_ID);

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(buildOperation(contract))
    .setTimeout(30)
    .build();

  const simulation = await sorobanServer.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(simulation.error || "Simulation failed");
  }

  return simulation;
}

/**
 * POST /api/prepare-transaction
 * Prepares a cast_vote Soroban contract transaction
 */
app.post("/api/prepare-transaction", async (req, res) => {
  try {
    const { from, option } = req.body;

    if (!from || option === undefined || option === null) {
      return res.status(400).json(
        errorResponse(
          ErrorCodes.INVALID_PARAMS,
          "Missing required parameters: from, option"
        )
      );
    }

    const optionNum = parseInt(option, 10);
    if (isNaN(optionNum) || optionNum < 1 || optionNum > 4) {
      return res.status(400).json(
        errorResponse(
          ErrorCodes.INVALID_PARAMS,
          "Option must be between 1 and 4"
        )
      );
    }

    const accountData = await getAccount(from);
    const sourceAccount = new Account(accountData.account_id, accountData.sequence);

    const contract = new Contract(CONTRACT_ID);

    let transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          "cast_vote",
          Address.fromString(from).toScVal(),
          nativeToScVal(optionNum, { type: "u32" })
        )
      )
      .setTimeout(30)
      .build();

    // Simulate transaction
    const simulation = await sorobanServer.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulation)) {
      console.error("Simulation error:", simulation.error);
      return res.status(400).json(
        errorResponse(
          ErrorCodes.SIMULATION_FAILED,
          "Contract simulation failed",
          simulation.error
        )
      );
    }

    if (!simulation.result) {
      return res.status(400).json(
        errorResponse(
          ErrorCodes.SIMULATION_FAILED,
          "Simulation returned no result"
        )
      );
    }

    // Assemble transaction with simulation results
    const assembledTx = rpc.assembleTransaction(transaction, simulation);
    const preparedTx = assembledTx.build();


    res.json({
      xdr: preparedTx.toXDR(),
      hash: preparedTx.hash().toString("hex"),
      fee: preparedTx.fee,
      operations: preparedTx.operations.length,
    });
  } catch (error) {
    console.error("Prepare transaction error:", error);
    
    if (error.message.includes("Account not found")) {
      return res.status(404).json(
        errorResponse(ErrorCodes.ACCOUNT_NOT_FOUND, error.message)
      );
    }

    res.status(500).json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to prepare transaction",
        error.message
      )
    );
  }
});

/**
 * POST /api/submit-transaction
 * Submits a signed transaction and initiates polling
 */
app.post("/api/submit-transaction", async (req, res) => {
  try {
    const { signedXdr } = req.body;

    if (!signedXdr) {
      return res.status(400).json(
        errorResponse(ErrorCodes.INVALID_PARAMS, "Missing signedXdr parameter")
      );
    }

    // Parse transaction
    const transaction = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

    // Submit to Soroban
    const sendResponse = await sorobanServer.sendTransaction(transaction);

    if (sendResponse.status === "ERROR") {
      return res.status(400).json(
        errorResponse(
          ErrorCodes.TRANSACTION_FAILED,
          "Transaction submission failed",
          sendResponse
        )
      );
    }

    const hash = sendResponse.hash;

    // Cache initial status
    txCache.set(hash, { status: "PENDING", submittedAt: Date.now() });

    // Start polling in background (don't await)
    pollTransactionStatus(hash).then((result) => {
      txCache.set(hash, { ...result, completedAt: Date.now() });
    });

    res.json({
      hash,
      status: "PENDING",
      message: "Transaction submitted successfully",
    });
  } catch (error) {
    console.error("Submit transaction error:", error);
    res.status(500).json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to submit transaction",
        error.message
      )
    );
  }
});

/**
 * GET /api/transaction-status/:hash
 * Get transaction status (from cache or RPC)
 */
app.get("/api/transaction-status/:hash", async (req, res) => {
  try {
    const { hash } = req.params;

    // Check cache first
    const cached = txCache.get(hash);
    if (cached && cached.status !== "PENDING") {
      return res.json(cached);
    }

    // Poll RPC directly
    const response = await sorobanServer.getTransaction(hash);

    const result = {
      status: response.status,
      ledger: response.ledger,
    };

    if (response.status === "SUCCESS") {
      result.result = response.resultXdr;
      result.resultMeta = response.resultMetaXdr;
    } else if (response.status === "FAILED") {
      result.error = response.resultXdr;
    }

    // Update cache
    txCache.set(hash, result);

    res.json(result);
  } catch (error) {
    console.error("Transaction status error:", error);
    res.status(500).json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to fetch transaction status",
        error.message
      )
    );
  }
});

/**
 * GET /api/poll/results
 * Fetch live poll results from contract
 */
app.get("/api/poll/results", async (req, res) => {
  try {
    const wallet = req.query.wallet;

    if (!wallet) {
      return res.status(400).json(
        errorResponse(ErrorCodes.INVALID_PARAMS, "Missing wallet query parameter")
      );
    }

    const POLL_OPTIONS = [
      { id: 1, label: "Smart Contracts (Soroban)" },
      { id: 2, label: "Asset Issuance" },
      { id: 3, label: "DEX & Trading" },
      { id: 4, label: "Cross-border Payments" },
    ];

    const questionSim = await simulateReadCall(wallet, (contract) =>
      contract.call("get_question")
    );
    const question = questionSim.result?.retval
      ? scValToNative(questionSim.result.retval) || "Which Stellar feature excites you most?"
      : "Which Stellar feature excites you most?";

    const totalSim = await simulateReadCall(wallet, (contract) =>
      contract.call("get_total_votes")
    );
    const totalVotes = totalSim.result?.retval
      ? Number(totalSim.result.retval.value())
      : 0;

    const hasVotedSim = await simulateReadCall(wallet, (contract) =>
      contract.call("has_voted", Address.fromString(wallet).toScVal())
    );
    const hasVoted = hasVotedSim.result?.retval
      ? scValToNative(hasVotedSim.result.retval) === true
      : false;

    let userVote = 0;
    if (hasVoted) {
      const userVoteSim = await simulateReadCall(wallet, (contract) =>
        contract.call("get_user_vote", Address.fromString(wallet).toScVal())
      );
      userVote = userVoteSim.result?.retval
        ? Number(userVoteSim.result.retval.value())
        : 0;
    }

    const options = [];
    for (const opt of POLL_OPTIONS) {
      const countSim = await simulateReadCall(wallet, (contract) =>
        contract.call("get_vote_count", nativeToScVal(opt.id, { type: "u32" }))
      );
      const votes = countSim.result?.retval
        ? Number(countSim.result.retval.value())
        : 0;
      options.push({
        ...opt,
        votes,
        percentage: totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0,
      });
    }

    return res.json({ question, options, totalVotes, userVote, hasVoted });
  } catch (error) {
    console.error("Fetch poll results error:", error);

    if (error.message.includes("Account not found")) {
      return res.status(404).json(
        errorResponse(ErrorCodes.ACCOUNT_NOT_FOUND, error.message)
      );
    }

    res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch poll results", error.message)
    );
  }
});

const POLL_OPTION_LABELS = {
  1: "Smart Contracts (Soroban)",
  2: "Asset Issuance",
  3: "DEX & Trading",
  4: "Cross-border Payments",
};

/**
 * Parse a contract vote event into a transaction record
 */
function parseVoteEvent(event) {
  try {
    const topic = (event.topic || []).map((t) => scValToNative(t));
    const isVote =
      topic.includes("vote") ||
      (typeof topic[0] === "string" && topic[0].toLowerCase() === "vote");

    if (!isVote) return null;

    const value = scValToNative(event.value);
    if (!Array.isArray(value) || value.length < 4) return null;

    const option = Number(value[1]);
    const rawTs = value[2];
    const timestampSec =
      typeof rawTs === "bigint" ? Number(rawTs) : Number(rawTs);

    return {
      id: event.id || `${event.ledger}-${event.txHash || Date.now()}`,
      hash: event.txHash || null,
      voter: String(value[0]),
      option,
      optionLabel: POLL_OPTION_LABELS[option] || `Option ${option}`,
      timestamp: timestampSec >= 1e12 ? timestampSec : timestampSec * 1000,
      totalVotes: Number(value[3]),
      ledger: event.ledger,
      successful: event.inSuccessfulContractCall !== false,
      type: "vote",
    };
  } catch (err) {
    console.error("Failed to parse vote event:", err);
    return null;
  }
}

/**
 * GET /api/vote-transactions
 * Fetch recent vote transactions from contract events
 */
app.get("/api/vote-transactions", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const wallet = req.query.wallet || null;

    const latestLedger = await sorobanServer.getLatestLedger();
    // RPC only retains recent ledgers — stay within a safe window
    const startLedger = Math.max(1, latestLedger.sequence - 5000);

    const eventsResponse = await sorobanServer.getEvents({
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [CONTRACT_ID],
        },
      ],
    });

    let transactions = (eventsResponse.events || [])
      .map(parseVoteEvent)
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (wallet) {
      transactions = transactions.filter((tx) => tx.voter === wallet);
    }

    transactions = transactions.slice(0, limit);

    res.json({
      transactions,
      total: transactions.length,
      contractId: CONTRACT_ID,
    });
  } catch (error) {
    console.error("Fetch vote transactions error:", error);
    res.status(500).json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to fetch vote transactions",
        error.message
      )
    );
  }
});

/**
 * GET /api/events/stream
 * Server-Sent Events endpoint for real-time contract events
 */
app.get("/api/events/stream", async (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const contractId = req.query.contract || CONTRACT_ID;
  const startLedger = req.query.since || undefined;

  console.log(`SSE client connected for contract: ${contractId}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", contractId })}\n\n`);

  // Poll for events every 5 seconds
  const pollInterval = setInterval(async () => {
    try {
      // Get latest ledger
      const latestLedger = await sorobanServer.getLatestLedger();

      // Get events from contract
      const events = await sorobanServer.getEvents({
        startLedger: startLedger || latestLedger.sequence - 100,
        filters: [
          {
            type: "contract",
            contractIds: [contractId],
          },
        ],
      });

      if (events.events && events.events.length > 0) {
        for (const event of events.events) {
          res.write(`data: ${JSON.stringify({
            type: "event",
            ledger: event.ledger,
            id: event.id,
            contractId: event.contractId,
            topic: event.topic,
            value: event.value,
            inSuccessfulContractCall: event.inSuccessfulContractCall,
          })}\n\n`);
        }
      }
    } catch (error) {
      console.error("Event fetch error:", error);
    }
  }, 5000);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(pollInterval);
    console.log("SSE client disconnected");
  });
});

/**
 * GET /
 * API root — confirms deployment is live
 */
app.get("/", (req, res) => {
  res.json({
    name: "Stellar Live Poll API",
    status: "running",
    network: "TESTNET",
    endpoints: {
      health: "/api/health",
      prepareTransaction: "POST /api/prepare-transaction",
      submitTransaction: "POST /api/submit-transaction",
      transactionStatus: "GET /api/transaction-status/:hash",
      pollResults: "GET /api/poll/results",
      voteTransactions: "GET /api/vote-transactions",
      events: "GET /api/events/stream",
    },
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    contract: CONTRACT_ID,
    network: "TESTNET",
    sorobanRpc: SOROBAN_RPC_URL,
    horizonUrl: HORIZON_URL,
  });
});

// Start server locally; export for Vercel
const PORT = process.env.PORT || 4000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Stellar Live Poll Backend running on http://localhost:${PORT}`);
    console.log(`📝 Contract ID: ${CONTRACT_ID}`);
    console.log(`🌐 Network: TESTNET`);
    console.log(`\n✅ Endpoints:`);
    console.log(`   POST /api/prepare-transaction`);
    console.log(`   POST /api/submit-transaction`);
    console.log(`   GET  /api/transaction-status/:hash`);
    console.log(`   GET  /api/poll/results`);
    console.log(`   GET  /api/vote-transactions`);
    console.log(`   GET  /api/events/stream`);
    console.log(`   GET  /api/health`);
  });
}

export default app;
