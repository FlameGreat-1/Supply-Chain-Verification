// src/services/erp-adapter.service.js
const axios = require('axios');

class ERPAdapterService {
    constructor() {
        this.erpSystems = {
            sap: {
                baseUrl: process.env.SAP_API_URL,
                apiKey: process.env.SAP_API_KEY
            },
            oracle: {
                baseUrl: process.env.ORACLE_API_URL,
                apiKey: process.env.ORACLE_API_KEY
            },
            // Add more ERP systems as needed
        };
    }

    async getProductData(erpSystem, productId) {
        const system = this.erpSystems[erpSystem];
        if (!system) {
            throw new Error(`Unsupported ERP system: ${erpSystem}`);
        }

        try {
            const response = await axios.get(`${system.baseUrl}/products/${productId}`, {
                headers: { 'Authorization': `Bearer ${system.apiKey}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch product data from ${erpSystem}: ${error.message}`);
        }
    }

    async updateProductData(erpSystem, productId, data) {
        const system = this.erpSystems[erpSystem];
        if (!system) {
            throw new Error(`Unsupported ERP system: ${erpSystem}`);
        }

        try {
            const response = await axios.put(`${system.baseUrl}/products/${productId}`, data, {
                headers: { 'Authorization': `Bearer ${system.apiKey}` }
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to update product data in ${erpSystem}: ${error.message}`);
        }
    }
}

module.exports = new ERPAdapterService();
