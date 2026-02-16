pragma circom 0.5.0;

include "circomlib/poseidon.circom";

template CredentialProof() {
    signal input secret;
    signal input credentialHash;
    signal input nullifier;
    
    component poseidon = Poseidon(2);
    component nullifierHasher = Poseidon(1);
    
    poseidon.inputs[0] <== secret;
    poseidon.inputs[1] <== credentialHash;
    
    nullifierHasher.inputs[0] <== secret;
    
    poseidon.out === credentialHash;
    nullifierHasher.out === nullifier;
}

component main {public [credentialHash, nullifier]} = CredentialProof();
