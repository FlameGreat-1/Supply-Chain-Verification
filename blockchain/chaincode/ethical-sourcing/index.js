'use strict';

const { Contract } = require('fabric-contract-api');

class EthicalSourcing extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

    async addCertification(ctx, productId, certificationBody, certificationDate, expirationDate, certificationDetails) {
        console.info('============= START : Add Certification ===========');

        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productId} does not exist`);
        }
        const product = JSON.parse(productAsBytes.toString());

        if (!product.certifications) {
            product.certifications = [];
        }

        const certification = {
            certificationBody,
            certificationDate,
            expirationDate,
            certificationDetails,
            status: 'Active'
        };

        product.certifications.push(certification);

        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        console.info('============= END : Add Certification ===========');
    }

    async verifyCertification(ctx, productId, certificationBody) {
        console.info('============= START : Verify Certification ===========');

        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productId} does not exist`);
        }
        const product = JSON.parse(productAsBytes.toString());

        if (!product.certifications) {
            return JSON.stringify({ isValid: false, message: 'No certifications found for this product' });
        }

        const certification = product.certifications.find(cert => cert.certificationBody === certificationBody);

        if (!certification) {
            return JSON.stringify({ isValid: false, message: 'Certification not found' });
        }

        const currentDate = new Date();
        const expirationDate = new Date(certification.expirationDate);

        if (currentDate > expirationDate) {
            certification.status = 'Expired';
            await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
            return JSON.stringify({ isValid: false, message: 'Certification has expired' });
        }

        console.info('============= END : Verify Certification ===========');
        return JSON.stringify({ isValid: true, certification });
    }

    async addEthicalScore(ctx, productId, scoreCategory, score, assessmentDate, assessor) {
        console.info('============= START : Add Ethical Score ===========');

        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productId} does not exist`);
        }
        const product = JSON.parse(productAsBytes.toString());

        if (!product.ethicalScores) {
            product.ethicalScores = [];
        }

        const ethicalScore = {
            scoreCategory,
            score,
            assessmentDate,
            assessor
        };

        product.ethicalScores.push(ethicalScore);

        // Calculate overall ethical score
        const totalScore = product.ethicalScores.reduce((sum, score) => sum + score.score, 0);
        product.overallEthicalScore = totalScore / product.ethicalScores.length;

        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        console.info('============= END : Add Ethical Score ===========');
    }

    async getEthicalProfile(ctx, productId) {
        console.info('============= START : Get Ethical Profile ===========');

        const productAsBytes = await ctx.stub.getState(productId);
        if (!productAsBytes || productAsBytes.length === 0) {
            throw new Error(`${productId} does not exist`);
        }
        const product = JSON.parse(productAsBytes.toString());

        const ethicalProfile = {
            productId: product.id,
            certifications: product.certifications || [],
            ethicalScores: product.ethicalScores || [],
            overallEthicalScore: product.overallEthicalScore || 0
        };

        console.info('============= END : Get Ethical Profile ===========');
        return JSON.stringify(ethicalProfile);
    }
}

module.exports = EthicalSourcing;
