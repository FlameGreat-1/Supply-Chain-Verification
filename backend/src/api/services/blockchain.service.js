const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const Web3 = require('web3');
const ProductVerificationABI = require('../abis/ProductVerification.json');
const EthicalSourcingABI = require('../abis/EthicalSourcing.json');
const SupplyChainTokenABI = require('../abis/SupplyChainToken.json');
const logger = require('../../utils/logger');
const config = require('../../config/config');

class BlockchainService {
    constructor() {
        // Hyperledger Fabric setup
        this.connectionProfile = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'connection-profile.json'), 'utf8'));
        this.walletPath = path.join(process.cwd(), 'wallet');
        this.channelName = 'supplychainchannel';
        this.chaincodeName = 'supplychain';

        // Ethereum setup
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.blockchain.ethereumProviderUrl));
        this.productVerificationContract = new this.web3.eth.Contract(ProductVerificationABI.abi, config.blockchain.productVerificationAddress);
        this.ethicalSourcingContract = new this.web3.eth.Contract(EthicalSourcingABI.abi, config.blockchain.ethicalSourcingAddress);
        this.supplyChainTokenContract = new this.web3.eth.Contract(SupplyChainTokenABI.abi, config.blockchain.supplyChainTokenAddress);
    }

    // Hyperledger Fabric methods
    async connectToNetwork(username) {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);
            const gateway = new Gateway();

            await gateway.connect(this.connectionProfile, {
                wallet,
                identity: username,
                discovery: { enabled: true, asLocalhost: config.blockchain.asLocalhost }
            });

            const network = await gateway.getNetwork(this.channelName);
            const contract = network.getContract(this.chaincodeName);

            return { gateway, contract };
        } catch (error) {
            logger.error(`Failed to connect to the blockchain network: ${error}`);
            throw new Error('Blockchain network connection failed');
        }
    }

    async recordProductCreation(product) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            await contract.submitTransaction('createProduct', 
                product.id, 
                product.name, 
                product.manufacturer, 
                product.manufacturingDate, 
                product.batchNumber
            );
            logger.info(`Product ${product.id} recorded on blockchain`);
        } catch (error) {
            logger.error(`Failed to record product creation on blockchain: ${error}`);
            throw new Error('Blockchain transaction failed');
        } finally {
            gateway.disconnect();
        }
    }

    async getProductData(productId) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            const result = await contract.evaluateTransaction('queryProduct', productId);
            return JSON.parse(result.toString());
        } catch (error) {
            logger.error(`Failed to get product data from blockchain: ${error}`);
            throw new Error('Blockchain query failed');
        } finally {
            gateway.disconnect();
        }
    }

    async recordProductUpdate(productId, updateData, updatedBy) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            await contract.submitTransaction('updateProduct', 
                productId, 
                JSON.stringify(updateData), 
                updatedBy
            );
            logger.info(`Product ${productId} update recorded on blockchain`);
        } catch (error) {
            logger.error(`Failed to record product update on blockchain: ${error}`);
            throw new Error('Blockchain transaction failed');
        } finally {
            gateway.disconnect();
        }
    }

    async recordProductTransfer(productId, newOwner, location, transferredBy) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            await contract.submitTransaction('transferProduct', 
                productId, 
                newOwner, 
                location, 
                transferredBy
            );
            logger.info(`Product ${productId} transfer recorded on blockchain`);
        } catch (error) {
            logger.error(`Failed to record product transfer on blockchain: ${error}`);
            throw new Error('Blockchain transaction failed');
        } finally {
            gateway.disconnect();
        }
    }

    async verifyProduct(productId, verificationCode) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            const result = await contract.evaluateTransaction('verifyProduct', productId, verificationCode);
            return JSON.parse(result.toString());
        } catch (error) {
            logger.error(`Failed to verify product on blockchain: ${error}`);
            throw new Error('Blockchain verification failed');
        } finally {
            gateway.disconnect();
        }
    }

    async getProductHistory(productId) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            const result = await contract.evaluateTransaction('getProductHistory', productId);
            return JSON.parse(result.toString());
        } catch (error) {
            logger.error(`Failed to get product history from blockchain: ${error}`);
            throw new Error('Blockchain query failed');
        } finally {
            gateway.disconnect();
        }
    }
    
    async recordIoTData(iotData) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            await contract.submitTransaction('recordIoTData', 
                iotData.device_id,
                iotData.product_id.toString(),
                iotData.timestamp.toISOString(),
                JSON.stringify({
                    temperature: iotData.temperature,
                    humidity: iotData.humidity,
                    motion: iotData.motion,
                    distance: iotData.distance,
                    weight: iotData.weight,
                    location: iotData.location
                })
            );
            logger.info(`IoT data recorded on blockchain for device: ${iotData.device_id}`);
        } catch (error) {
            logger.error(`Failed to record IoT data on blockchain: ${error}`);
            throw new Error('Blockchain transaction failed');
        } finally {
            gateway.disconnect();
        }
    }

    async recordCertification(productId, certification) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            await contract.submitTransaction('addCertification', 
                productId, 
                certification.certificationBody, 
                certification.certificationDate, 
                certification.expirationDate, 
                JSON.stringify(certification.certificationDetails)
            );
            logger.info(`Certification recorded for product ${productId} on blockchain`);
        } catch (error) {
            logger.error(`Failed to record certification on blockchain: ${error}`);
            throw new Error('Blockchain transaction failed');
        } finally {
            gateway.disconnect();
        }
    }

    async verifyCertification(productId, certificationId) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            const result = await contract.evaluateTransaction('verifyCertification', productId, certificationId);
            return JSON.parse(result.toString());
        } catch (error) {
            logger.error(`Failed to verify certification on blockchain: ${error}`);
            throw new Error('Blockchain verification failed');
        } finally {
            gateway.disconnect();
        }
    }

    async recordEthicalScore(productId, ethicalScore) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            await contract.submitTransaction('addEthicalScore', 
                productId, 
                ethicalScore.scoreCategory, 
                ethicalScore.score.toString(), 
                ethicalScore.assessmentDate, 
                ethicalScore.assessor
            );
            logger.info(`Ethical score recorded for product ${productId} on blockchain`);
        } catch (error) {
            logger.error(`Failed to record ethical score on blockchain: ${error}`);
            throw new Error('Blockchain transaction failed');
        } finally {
            gateway.disconnect();
        }
    }

    async getEthicalProfile(productId) {
        const { gateway, contract } = await this.connectToNetwork('admin');
        try {
            const result = await contract.evaluateTransaction('getEthicalProfile', productId);
            return JSON.parse(result.toString());
        } catch (error) {
            logger.error(`Failed to get ethical profile from blockchain: ${error}`);
            throw new Error('Blockchain query failed');
        } finally {
            gateway.disconnect();
        }
    }

    // Ethereum methods
    async getEthereumAccount() {
        const accounts = await this.web3.eth.getAccounts();
        return accounts[0]; // Using the first account. In production, you'd want a more robust account management system.
    }

    async createProductEth(product) {
        const account = await this.getEthereumAccount();
        try {
            const result = await this.productVerificationContract.methods.createProduct(
                product.name,
                product.manufacturer,
                this.web3.utils.toHex(new Date(product.manufacturingDate).getTime() / 1000),
                product.batchNumber,
                product.metadata
            ).send({ from: account });
            logger.info(`Product created on Ethereum: ${result.events.ProductCreated.returnValues.productId}`);
            return result.events.ProductCreated.returnValues.productId;
        } catch (error) {
            logger.error(`Failed to create product on Ethereum: ${error}`);
            throw new Error('Ethereum transaction failed');
        }
    }

    async getProductEth(productId) {
        try {
            const result = await this.productVerificationContract.methods.getProduct(productId).call();
            return {
                id: result.id,
                name: result.name,
                manufacturer: result.manufacturer,
                manufacturingDate: new Date(Number(result.manufacturingDate) * 1000),
                batchNumber: result.batchNumber,
                currentOwner: result.currentOwner,
                status: this.getProductStatus(Number(result.status)),
                metadata: result.metadata
            };
        } catch (error) {
            logger.error(`Failed to get product from Ethereum: ${error}`);
            throw new Error('Ethereum query failed');
        }
    }

    async transferProductEth(productId, newOwner, location) {
        const account = await this.getEthereumAccount();
        try {
            await this.productVerificationContract.methods.transferProduct(productId, newOwner, location)
                .send({ from: account });
            logger.info(`Product ${productId} transferred on Ethereum`);
        } catch (error) {
            logger.error(`Failed to transfer product on Ethereum: ${error}`);
            throw new Error('Ethereum transaction failed');
        }
    }

    async createEthicalAssessmentEth(productId, category, score, evidence) {
        const account = await this.getEthereumAccount();
        try {
            const result = await this.ethicalSourcingContract.methods.createAssessment(
                productId,
                category,
                score,
                evidence
            ).send({ from: account });
            logger.info(`Ethical assessment created on Ethereum: ${result.events.AssessmentCreated.returnValues.assessmentId}`);
            return result.events.AssessmentCreated.returnValues.assessmentId;
        } catch (error) {
            logger.error(`Failed to create ethical assessment on Ethereum: ${error}`);
            throw new Error('Ethereum transaction failed');
        }
    }

    async getEthicalProfileEth(productId) {
        try {
            const result = await this.ethicalSourcingContract.methods.calculateEthicalScore(productId).call();
            return {
                overallScore: Number(result)
            };
        } catch (error) {
            logger.error(`Failed to get ethical profile from Ethereum: ${error}`);
            throw new Error('Ethereum query failed');
        }
    }

    async mintTokensEth(to, amount) {
        const account = await this.getEthereumAccount();
        try {
            await this.supplyChainTokenContract.methods.mint(to, amount).send({ from: account });
            logger.info(`Tokens minted on Ethereum: ${amount} to ${to}`);
        } catch (error) {
            logger.error(`Failed to mint tokens on Ethereum: ${error}`);
            throw new Error('Ethereum transaction failed');
        }
    }

    async getTokenBalanceEth(address) {
        try {
            const balance = await this.supplyChainTokenContract.methods.balanceOf(address).call();
            return Number(balance);
        } catch (error) {
            logger.error(`Failed to get token balance from Ethereum: ${error}`);
            throw new Error('Ethereum query failed');
        }
    }

    getProductStatus(statusCode) {
        const statuses = ['Created', 'InTransit', 'Delivered', 'Sold', 'Recalled'];
        return statuses[statusCode] || 'Unknown';
    }
}

module.exports = new BlockchainService();
