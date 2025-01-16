const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const logger = require('../utils/logger');

const certificationSchema = new mongoose.Schema({
    certificationBody: {
        type: String,
        required: true
    },
    certificationDate: {
        type: Date,
        required: true
    },
    expirationDate: {
        type: Date,
        required: true
    },
    certificationDetails: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Revoked'],
        default: 'Active'
    }
}, { timestamps: true });

const ethicalScoreSchema = new mongoose.Schema({
    scoreCategory: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    assessmentDate: {
        type: Date,
        required: true
    },
    assessor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },
    manufacturingDate: {
        type: Date,
        required: true
    },
    batchNumber: {
        type: String,
        required: true,
        unique: true
    },
    currentOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    certifications: [certificationSchema],
    ethicalScores: [ethicalScoreSchema],
    overallEthicalScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    trackingHistory: [{
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        location: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    additionalDetails: {
        type: Object
    },
    iotData: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IoTData'
    }]
}, { timestamps: true });

productSchema.plugin(mongoosePaginate);

productSchema.index({ name: 'text', manufacturer: 'text', batchNumber: 'text' });

productSchema.statics.addIoTData = async function(productId, iotDataId) {
    try {
        const product = await this.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        product.iotData.push(iotDataId);
        await product.save();
        logger.info(`IoT data ${iotDataId} added to product ${productId}`);
    } catch (error) {
        logger.error(`Error adding IoT data to product: ${error.message}`);
        throw error;
    }
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
