/*
 * Credential Proof Circuit
 * 
 * Purpose: Prove ownership of a credential without revealing the secret
 * 
 * Inputs:
 * - secret: Private input (holder's secret key)
 * - credentialHash: Public input (hash of credential)
 * 
 * Outputs:
 * - nullifier: Public output (unique identifier to prevent double-spending)
 *
 * This circuit proves:
 * 1. The holder knows a secret
 * 2. The credentialHash matches the commitment
 * 3. The nullifier is derived correctly
 */

pragma circom 2.0.0;

include "circomlib/poseidon.circom";
include "circomlib/bitify.circom";

template CredentialProof() {
    // Private inputs
    signal input secret;
    
    // Public inputs
    signal input credentialHash;
    signal input nullifier;
    
    // Intermediate signals
    signal commitment;
    signal computedNullifier;
    
    // Verify commitment matches credential hash
    // commitment = Poseidon(secret, credentialHash)
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== secret;
    poseidon.inputs[1] <== credentialHash;
    commitment <== poseidon.out;
    
    // Verify nullifier is derived correctly
    // nullifier = Poseidon(secret)
    component nullifierHash = Poseidon(1);
    nullifierHash.inputs[0] <== secret;
    computedNullifier <== nullifierHash.out;
    
    // Constrain nullifier
    computedNullifier === nullifier;
    
    // Make commitment public (this is what gets verified)
    commitment === credentialHash;
}

component main {public [credentialHash, nullifier]} = CredentialProof();
