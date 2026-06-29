#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{Env, Address, testutils::Address as _};

#[test]
fn test_constructor_sets_question() {
    let env = Env::default();
    let contract_id = env.register(LivePoll, ());
    let client = LivePollClient::new(&env, &contract_id);

    let question = client.get_question();
    assert_eq!(question, String::from_str(&env, "Which Stellar feature excites you most?"));
    assert_eq!(client.get_option_count(), 4);
}

#[test]
fn test_cast_vote() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LivePoll, ());
    let client = LivePollClient::new(&env, &contract_id);

    let voter = Address::generate(&env);

    assert!(!client.has_voted(&voter));
    client.cast_vote(&voter, &2);

    assert!(client.has_voted(&voter));
    assert_eq!(client.get_user_vote(&voter), 2);
    assert_eq!(client.get_vote_count(&2), 1);
    assert_eq!(client.get_total_votes(), 1);
}

#[test]
fn test_multiple_votes() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LivePoll, ());
    let client = LivePollClient::new(&env, &contract_id);

    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);

    client.cast_vote(&voter1, &1);
    client.cast_vote(&voter2, &1);
    client.cast_vote(&voter3, &3);

    assert_eq!(client.get_vote_count(&1), 2);
    assert_eq!(client.get_vote_count(&3), 1);
    assert_eq!(client.get_total_votes(), 3);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_already_voted() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LivePoll, ());
    let client = LivePollClient::new(&env, &contract_id);

    let voter = Address::generate(&env);
    client.cast_vote(&voter, &1);
    client.cast_vote(&voter, &2);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_invalid_option() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LivePoll, ());
    let client = LivePollClient::new(&env, &contract_id);

    let voter = Address::generate(&env);
    client.cast_vote(&voter, &5);
}
