// src/iot/gateway/mqtt-broker.js

const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const httpServer = require('http').createServer();
const ws = require('websocket-stream');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../../src/utils/logger');
const config = require('../../src/config/config');
const blockchainService = require('../../src/api/services/blockchain.service');
const analyticsService = require('../../src/api/services/analytics.service');
const User = require('../../src/models/user.model');

const port = process.env.MQTT_PORT || 1883;
const wsPort = process.env.MQTT_WS_PORT || 8888;

// MongoDB connection
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
}).then(() => {
  logger.info('Connected to MongoDB');
}).catch((err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(1);
});

// Define a schema for IoT data
const IoTDataSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  timestamp: { type: Date, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  motion: { type: Boolean, required: true },
  distance: { type: Number, required: true },
  weight: { type: Number, required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  location: { type: String, required: true }
}, { timestamps: true });

const IoTData = mongoose.model('IoTData', IoTDataSchema);

// Authenticate the client
aedes.authenticate = async (client, username, password, callback) => {
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password.toString(), user.password))) {
      return callback(new Error('Authentication failed'), false);
    }
    client.user = user;
    callback(null, true);
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    callback(error, false);
  }
};

// Authorize publish
aedes.authorizePublish = (client, packet, callback) => {
  if (!client.user) {
    return callback(new Error('Unauthorized'));
  }
  // Check if the client has the right to publish to this topic
  const allowedTopics = [`supply_chain/${client.user.role}/#`, 'supply_chain/data'];
  if (!allowedTopics.some(topic => packet.topic.startsWith(topic))) {
    return callback(new Error('Unauthorized to publish to this topic'));
  }
  callback(null);
};

// Authorize subscribe
aedes.authorizeSubscribe = (client, sub, callback) => {
  if (!client.user) {
    return callback(new Error('Unauthorized'));
  }
  // Check if the client has the right to subscribe to this topic
  const allowedTopics = [`supply_chain/${client.user.role}/#`, 'supply_chain/data'];
  if (!allowedTopics.some(topic => sub.topic.startsWith(topic))) {
    return callback(new Error('Unauthorized to subscribe to this topic'));
  }
  callback(null, sub);
};

// Handle client connections
aedes.on('client', function (client) {
  logger.info(`Client Connected: ${client.id}`);
});

// Handle client disconnections
aedes.on('clientDisconnect', function (client) {
  logger.info(`Client Disconnected: ${client.id}`);
});

// Handle published messages
aedes.on('publish', async function (packet, client) {
  if (client && packet.topic.startsWith('supply_chain/')) {
    logger.info(`Message from ${client.id} on topic ${packet.topic}: ${packet.payload.toString()}`);
    try {
      const data = JSON.parse(packet.payload.toString());
      
      if (packet.topic === 'supply_chain/data') {
        await handleIoTData(data);
      } else if (packet.topic === 'supply_chain/product-update') {
        await handleProductUpdate(data);
      } else if (packet.topic === 'supply_chain/transfer') {
        await handleProductTransfer(data);
      }
    } catch (error) {
      logger.error(`Error processing MQTT message: ${error.message}`);
    }
  }
});

async function handleIoTData(data) {
  const iotData = new IoTData(data);
  await iotData.save();
  logger.info(`IoT Data saved to MongoDB: ${iotData._id}`);

  // Update blockchain (both Hyperledger Fabric and Ethereum)
  await blockchainService.recordIoTData(iotData);
  await blockchainService.recordIoTDataEth(iotData);

  // Update analytics
  await analyticsService.processIoTData(iotData);

  // Check for anomalies and trigger alerts if necessary
  const anomalies = await analyticsService.detectAnomalies(iotData);
  if (anomalies.length > 0) {
    logger.warn(`Anomalies detected: ${JSON.stringify(anomalies)}`);
    // Trigger alerts (implement alert mechanism here)
  }
}

async function handleProductUpdate(data) {
  try {
    // Update on Hyperledger Fabric
    await blockchainService.recordProductUpdate(data.productId, data.updateData, 'IoT_Device');
    
    // Update on Ethereum
    const product = await productService.getProductById(data.productId);
    await blockchainService.updateProductEth(product.ethProductId, data.updateData);
    
    logger.info(`Product ${data.productId} updated on both blockchains`);
  } catch (error) {
    logger.error(`Error updating product on blockchains: ${error.message}`);
  }
}

async function handleProductTransfer(data) {
  try {
    // Record transfer on Hyperledger Fabric
    await blockchainService.recordProductTransfer(data.productId, data.newOwner, data.location, 'IoT_Device');
    
    // Record transfer on Ethereum
    const product = await productService.getProductById(data.productId);
    await blockchainService.transferProductEth(product.ethProductId, data.newOwner, data.location);
    
    logger.info(`Product ${data.productId} transferred on both blockchains`);
  } catch (error) {
    logger.error(`Error transferring product on blockchains: ${error.message}`);
  }
}

// Error handling
aedes.on('clientError', function (client, err) {
  logger.error(`Client error: client: ${client ? client.id : 'unknown'}, error: ${err.message}`);
});

aedes.on('connectionError', function (client, err) {
  logger.error(`Connection error: client: ${client ? client.id : 'unknown'}, error: ${err.message}`);
});

// Graceful shutdown
process.on('SIGINT', async function() {
  logger.info('MQTT Broker shutting down');
  await mongoose.connection.close();
  server.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
});

// Start the server
server.listen(port, function () {
  logger.info(`MQTT Broker running on port: ${port}`);
});

// WebSocket support
ws.createServer({ server: httpServer }, aedes.handle);
httpServer.listen(wsPort, function () {
  logger.info(`Websocket MQTT server listening on port ${wsPort}`);
});

module.exports = aedes;
