'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class ProductTracking extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

    async createProduct(ctx, id, name, manufacturer, manufacturingDate, batchNumber) {
        console.info('============= START : Create Product ===========');

        const product = {
            id,
            name,
            manufacturer,
            manufacturingDate,
            batchNumber,
            currentOwner: manufacturer,
            trackingHistory: [{
                owner: manufacturer,
                timestamp: new Date().toISOString(),
                location: 'Manufacturing Plant'
            }],
            docType: 'product'
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(product)));
        console.info('============= END : Create Product ===========');
    }

    async queryProduct(ctx, productId) {
        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productId} does not exist`);
        }
        console.log(productAsBytes.toString());
        return productAsBytes.toString();
    }

    async transferProduct(ctx, productId, newOwner, location) {
        console.info('============= START : transferProduct ===========');

        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productId} does not exist`);
        }
        const product = JSON.parse(productAsBytes.toString());
        product.currentOwner = newOwner;
        product.trackingHistory.push({
            owner: newOwner,
            timestamp: new Date().toISOString(),
            location: location
        });

        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        console.info('============= END : transferProduct ===========');
    }

    async getProductHistory(ctx, productId) {
        console.info('============= START : getProductHistory ===========');
        let iterator = await ctx.stub.getHistoryForKey(productId);
        let result = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value) {
                console.info(`found state update with value: ${res.value.value.toString('utf8')}`);
                const obj = JSON.parse(res.value.value.toString('utf8'));
                result.push(obj);
            }
            res = await iterator.next();
        }
        await iterator.close();
        console.info('============= END : getProductHistory ===========');
        return JSON.stringify(result);
    }

    async verifyProduct(ctx, productId, verificationCode) {
        console.info('============= START : verifyProduct ===========');
        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productId} does not exist`);
        }
        const product = JSON.parse(productAsBytes.toString());
        
        // In a real-world scenario, you'd use a more sophisticated verification method
        const hash = crypto.createHash('sha256');
        hash.update(product.id + product.manufacturingDate);
        const calculatedVerificationCode = hash.digest('hex');

        const isAuthentic = calculatedVerificationCode === verificationCode;

        console.info('============= END : verifyProduct ===========');
        return JSON.stringify({ isAuthentic });
    }
}

module.exports = ProductTracking;
