#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, symbol_short,
    Address, Env, String, panic_with_error,
};

/// Live Poll Contract — one-question poll with on-chain votes and real-time events
#[contract]
pub struct LivePoll;

const OPTION_COUNT: u32 = 4;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    VoteCount(u32),
    Voter(Address),
}

/// Error codes
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyVoted = 1,
    InvalidOption = 2,
    PollNotActive = 3,
}

#[contractimpl]
impl LivePoll {
    /// Runs once on deploy — sets the poll question and initializes vote counts
    pub fn __constructor(env: Env) {
        let question = String::from_str(&env, "Which Stellar feature excites you most?");
        env.storage()
            .instance()
            .set(&symbol_short!("QUEST"), &question);
        env.storage()
            .instance()
            .set(&symbol_short!("ACTIVE"), &true);

        for option in 1..=OPTION_COUNT {
            env.storage()
                .persistent()
                .set(&DataKey::VoteCount(option), &0u32);
        }
    }

    /// Cast a vote for one of the poll options (1–4). Each address may vote once.
    pub fn cast_vote(env: Env, voter: Address, option: u32) {
        voter.require_auth();

        let active: bool = env
            .storage()
            .instance()
            .get(&symbol_short!("ACTIVE"))
            .unwrap_or(false);

        if !active {
            panic_with_error!(&env, Error::PollNotActive);
        }

        if option == 0 || option > OPTION_COUNT {
            panic_with_error!(&env, Error::InvalidOption);
        }

        let voter_key = DataKey::Voter(voter.clone());
        if env.storage().persistent().has(&voter_key) {
            panic_with_error!(&env, Error::AlreadyVoted);
        }

        let count_key = DataKey::VoteCount(option);
        let current: u32 = env
            .storage()
            .persistent()
            .get(&count_key)
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&count_key, &(current + 1));
        env.storage().persistent().set(&voter_key, &option);

        let total = Self::get_total_votes(env.clone());
        let timestamp = env.ledger().timestamp();

        env.events().publish(
            (symbol_short!("vote"),),
            (voter, option, timestamp, total),
        );
    }

    /// Returns the poll question text
    pub fn get_question(env: Env) -> String {
        env.storage()
            .instance()
            .get(&symbol_short!("QUEST"))
            .unwrap_or(String::from_str(&env, ""))
    }

    /// Vote count for a single option (1–4)
    pub fn get_vote_count(env: Env, option: u32) -> u32 {
        if option == 0 || option > OPTION_COUNT {
            panic_with_error!(&env, Error::InvalidOption);
        }

        env.storage()
            .persistent()
            .get(&DataKey::VoteCount(option))
            .unwrap_or(0)
    }

    /// Total votes cast across all options
    pub fn get_total_votes(env: Env) -> u32 {
        let mut total: u32 = 0;
        for option in 1..=OPTION_COUNT {
            total += Self::get_vote_count(env.clone(), option);
        }
        total
    }

    /// Whether the given address has already voted
    pub fn has_voted(env: Env, voter: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Voter(voter))
    }

    /// Returns the option the voter chose (0 if they have not voted)
    pub fn get_user_vote(env: Env, voter: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Voter(voter))
            .unwrap_or(0)
    }

    /// Number of poll options (always 4)
    pub fn get_option_count(env: Env) -> u32 {
        let _ = env;
        OPTION_COUNT
    }
}
