// circuits/productVerification.circom
pragma circom 2.0.0;

include "circomlib/poseidon.circom";

template ProductVerification() {
    signal input productId;
    signal input manufacturerSecret;
    signal input timestamp;
    signal output hashOutput;

    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== productId;
    poseidon.inputs[1] <== manufacturerSecret;
    poseidon.inputs[2] <== timestamp;

    hashOutput <== poseidon.out;
}

component main = ProductVerification();
