'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class Verification extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

        async createVerificationRequest(ctx, productId, requesterId, requestType, additionalInfo) {
        console.info('============= START : Create Verification Request ===========');

        const verificationId = crypto.randomBytes(16).toString('hex');
        const timestamp = new Date().toISOString();

        const verificationRequest = {
            id: verificationId,
            productId,
            requesterId,
            requestType,
            additionalInfo,
            status: 'Pending',
            timestamp,
            verificationHistory: [{
                status: 'Pending',
                timestamp,
                updatedBy: requesterId
            }]
        };

        await ctx.stub.putState(verificationId, Buffer.from(JSON.stringify(verificationRequest)));

        console.info('============= END : Create Verification Request ===========');
        return JSON.stringify({ verificationId });
    }

    async processVerificationRequest(ctx, verificationId, verifierId, decision, comments) {
        console.info('============= START : Process Verification Request ===========');

        const verificationAsBytes = await ctx.stub.getState(verificationId);
        if (!verificationAsBytes || verificationAsBytes.length === 0) {
            throw new Error(`${verificationId} does not exist`);
        }

        const verification = JSON.parse(verificationAsBytes.toString());
        const timestamp = new Date().toISOString();

        verification.status = decision;
        verification.verificationHistory.push({
            status: decision,
            timestamp,
            updatedBy: verifierId,
            comments
        });

        await ctx.stub.putState(verificationId, Buffer.from(JSON.stringify(verification)));

        // Update product verification status
        const productAsBytes = await ctx.stub.getState(verification.productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${verification.productId} does not exist`);
        }

        const product = JSON.parse(productAsBytes.toString());
        product.verificationStatus = decision;
        product.lastVerificationDate = timestamp;

        await ctx.stub.putState(verification.productId, Buffer.from(JSON.stringify(product)));

        console.info('============= END : Process Verification Request ===========');
        return JSON.stringify({ status: decision });
    }

    async getVerificationStatus(ctx, productId) {
        console.info('============= START : Get Verification Status ===========');

        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productId} does not exist`);
        }

        const product = JSON.parse(productAsBytes.toString());
        const verificationStatus = {
            productId: product.id,
            status: product.verificationStatus || 'Not Verified',
            lastVerificationDate: product.lastVerificationDate || null
        };

        console.info('============= END : Get Verification Status ===========');
        return JSON.stringify(verificationStatus);
    }

    async getVerificationHistory(ctx, productId) {
        console.info('============= START : Get Verification History ===========');

        const query = {
            selector: {
                productId: productId
            },
            sort: [{ timestamp: 'desc' }]
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const verificationHistory = [];
        let result = await iterator.next();

        while (!result.done) {
            const verification = JSON.parse(result.value.value.toString());
            verificationHistory.push(verification);
            result = await iterator.next();
        }

        console.info('============= END : Get Verification History ===========');
        return JSON.stringify(verificationHistory);
    }

    async createVerificationRule(ctx, ruleId, ruleType, ruleParameters) {
        console.info('============= START : Create Verification Rule ===========');

        const rule = {
            id: ruleId,
            type: ruleType,
            parameters: JSON.parse(ruleParameters),
            createdAt: new Date().toISOString(),
            status: 'Active'
        };

        await ctx.stub.putState(ruleId, Buffer.from(JSON.stringify(rule)));

        console.info('============= END : Create Verification Rule ===========');
        return JSON.stringify({ ruleId });
    }

    async applyVerificationRule(ctx, productId, ruleId) {
        console.info('============= START : Apply Verification Rule ===========');

        const ruleAsBytes = await ctx.stub.getState(ruleId);
        if (!ruleAsBytes || ruleAsBytes.length === 0) {
            throw new Error(`Rule ${ruleId} does not exist`);
        }

        const rule = JSON.parse(ruleAsBytes.toString());
        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`Product ${productId} does not exist`);
        }

        const product = JSON.parse(productAsBytes.toString());

        let verificationResult;
        switch (rule.type) {
            case 'threshold':
                verificationResult = this.applyThresholdRule(product, rule.parameters);
                break;
            case 'timeWindow':
                verificationResult = this.applyTimeWindowRule(product, rule.parameters);
                break;
            // Add more rule types as needed
            default:
                throw new Error(`Unsupported rule type: ${rule.type}`);
        }

        product.verificationStatus = verificationResult.status;
        product.lastVerificationDate = new Date().toISOString();
        product.lastVerificationRule = ruleId;

        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

        console.info('============= END : Apply Verification Rule ===========');
        return JSON.stringify(verificationResult);
    }

    applyThresholdRule(product, parameters) {
        const { attribute, threshold, operator } = parameters;
        const value = product[attribute];

        let status;
        switch (operator) {
            case '>':
                status = value > threshold ? 'Verified' : 'Failed';
                break;
            case '<':
                status = value < threshold ? 'Verified' : 'Failed';
                break;
            case '>=':
                status = value >= threshold ? 'Verified' : 'Failed';
                break;
            case '<=':
                status = value <= threshold ? 'Verified' : 'Failed';
                break;
            case '==':
                status = value == threshold ? 'Verified' : 'Failed';
                break;
            default:
                throw new Error(`Unsupported operator: ${operator}`);
        }

        return { status, details: `${attribute} ${operator} ${threshold}` };
    }

    applyTimeWindowRule(product, parameters) {
        const { attribute, maxAge } = parameters;
        const attributeDate = new Date(product[attribute]);
        const currentDate = new Date();
        const ageInMilliseconds = currentDate - attributeDate;
        const ageInDays = ageInMilliseconds / (1000 * 60 * 60 * 24);

        const status = ageInDays <= maxAge ? 'Verified' : 'Failed';
        return { status, details: `${attribute} age: ${ageInDays.toFixed(2)} days, Max allowed: ${maxAge} days` };
    }
}

module.exports = Verification;
