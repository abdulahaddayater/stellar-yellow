# Live Poll Soroban Contract

On-chain polling contract for the Stellar Live Poll dApp.

## Build

```bash
cd contract/payment_tracker/contracts/hello-world
make build
```

## Test

```bash
make test
```

## Deploy (Testnet)

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --network testnet
```

The constructor automatically sets the poll question and initializes vote counts.

## Functions

- `cast_vote(voter, option)` — Record a vote (options 1–4)
- `get_question()` — Poll question string
- `get_vote_count(option)` — Votes for one option
- `get_total_votes()` — Total vote count
- `has_voted(voter)` — Check if address voted
- `get_user_vote(voter)` — User's chosen option (0 = none)

## Events

Emits `vote` event: `(voter, option, timestamp, total_votes)`
