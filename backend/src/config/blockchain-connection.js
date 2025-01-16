const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const channelName = process.env.FABRIC_CHANNEL_NAME;
const chaincodeName = process.env.FABRIC_CHAINCODE_NAME;
const mspOrg1 = process.env.FABRIC_MSP_ORG1;
const walletPath = path.join(process.cwd(), 'wallet');
const org1UserId = process.env.FABRIC_ORG1_USERID;

// Load connection profile
const ccpPath = path.resolve(__dirname, '..', '..', 'connection-profile.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

exports.connectToBlockchain = async () => {
    try {
        // Create a new CA client for interacting with the CA
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the admin user
        const identity = await wallet.get(org1UserId);
        if (!identity) {
            logger.info('An identity for the admin user does not exist in the wallet');
            logger.info('Enrolling the admin user');
            const enrollment = await ca.enroll({ enrollmentID: org1UserId, enrollmentSecret: process.env.FABRIC_ORG1_USER_SECRET });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: mspOrg1,
                type: 'X.509',
            };
            await wallet.put(org1UserId, x509Identity);
            logger.info('Successfully enrolled admin user and imported it into the wallet');
        }

        // Create a new gateway for connecting to our peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: org1UserId,
            discovery: { enabled: true, asLocalhost: process.env.AS_LOCALHOST === 'true' }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network
        const contract = network.getContract(chaincodeName);

        logger.info('Successfully connected to the blockchain network');

        return { gateway, network, contract };
    } catch (error) {
        logger.error(`Failed to connect to the blockchain network: ${error}`);
        throw new Error('Blockchain network connection failed');
    }
};

exports.disconnectFromBlockchain = async (gateway) => {
    if (gateway) {
        await gateway.disconnect();
        logger.info('Disconnected from the blockchain network');
    }
};

// Periodic health check
setInterval(async () => {
    try {
        const { gateway, contract } = await this.connectToBlockchain();
        await contract.evaluateTransaction('org.hyperledger.fabric:GetMetadata');
        logger.info('Blockchain network health check: OK');
        await this.disconnectFromBlockchain(gateway);
    } catch (error) {
        logger.error(`Blockchain network health check failed: ${error}`);
    }
}, 300000); // Check every 5 minutes
