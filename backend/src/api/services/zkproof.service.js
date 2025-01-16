// src/services/zkproof.service.js
const snarkjs = require("snarkjs");
const fs = require("fs");

class ZKProofService {
    constructor() {
        this.wasmFile = "./circuits/productVerification_js/productVerification.wasm";
        this.zkeyFile = "./circuits/productVerification_final.zkey";
    }

    async generateProof(productId, manufacturerSecret, timestamp) {
        const input = {
            productId: productId,
            manufacturerSecret: manufacturerSecret,
            timestamp: timestamp
        };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, this.wasmFile, this.zkeyFile);
        return { proof, publicSignals };
    }

    async verifyProof(proof, publicSignals) {
        const vKey = JSON.parse(fs.readFileSync("./circuits/verification_key.json"));
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        return res;
    }
}

module.exports = new ZKProofService();
