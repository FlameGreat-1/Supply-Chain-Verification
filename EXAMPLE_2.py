// src/api/routes/product.routes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// Create a new product
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(['manufacturer', 'admin']),
  validationMiddleware.validateProductCreation,
  productController.createProduct
);

// Get a product by ID
router.get(
  '/:productId',
  authMiddleware.authenticate,
  validationMiddleware.validateProductId,
  productController.getProduct
);

// Update a product
router.put(
  '/:productId',
  authMiddleware.authenticate,
  authMiddleware.authorize(['manufacturer', 'admin']),
  validationMiddleware.validateProductUpdate,
  productController.updateProduct
);

// Transfer product ownership
router.post(
  '/:productId/transfer',
  authMiddleware.authenticate,
  authMiddleware.authorize(['manufacturer', 'distributor', 'retailer']),
  validationMiddleware.validateProductTransfer,
  productController.transferProduct
);

// Verify product authenticity
router.post(
  '/:productId/verify',
  validationMiddleware.validateProductVerification,
  productController.verifyProduct
);

// Get product history
router.get(
  '/:productId/history',
  authMiddleware.authenticate,
  validationMiddleware.validateProductId,
  productController.getProductHistory
);

// Add certification to a product
router.post(
  '/:productId/certifications',
  authMiddleware.authenticate,
  authMiddleware.authorize(['certifier', 'admin']),
  validationMiddleware.validateCertificationAddition,
  productController.addCertification
);

// Verify product certification
router.get(
  '/:productId/certifications/:certificationId/verify',
  validationMiddleware.validateCertificationVerification,
  productController.verifyCertification
);

// Add ethical score to a product
router.post(
  '/:productId/ethical-scores',
  authMiddleware.authenticate,
  authMiddleware.authorize(['assessor', 'admin']),
  validationMiddleware.validateEthicalScoreAddition,
  productController.addEthicalScore
);

// Get product ethical profile
router.get(
  '/:productId/ethical-profile',
  authMiddleware.authenticate,
  validationMiddleware.validateProductId,
  productController.getEthicalProfile
);

// Search products
router.get(
  '/search',
  authMiddleware.authenticate,
  validationMiddleware.validateProductSearch,
  productController.searchProducts
);

// Get product statistics
router.get(
  '/statistics',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  productController.getProductStatistics
);

module.exports = router;
// src/api/routes/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// User registration
router.post(
  '/register',
  validationMiddleware.validateUserRegistration,
  userController.registerUser
);

// User login
router.post(
  '/login',
  validationMiddleware.validateUserLogin,
  userController.loginUser
);

// Get user profile
router.get(
  '/profile',
  authMiddleware.authenticate,
  userController.getUserProfile
);

// Update user profile
router.put(
  '/profile',
  authMiddleware.authenticate,
  validationMiddleware.validateProfileUpdate,
  userController.updateUserProfile
);

// Change password
router.put(
  '/change-password',
  authMiddleware.authenticate,
  validationMiddleware.validatePasswordChange,
  userController.changePassword
);

// Request password reset
router.post(
  '/forgot-password',
  validationMiddleware.validateEmailForReset,
  userController.requestPasswordReset
);

// Reset password
router.post(
  '/reset-password',
  validationMiddleware.validatePasswordReset,
  userController.resetPassword
);

// Get all users (admin only)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  userController.getAllUsers
);

// Get user by ID (admin only)
router.get(
  '/:userId',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateUserId,
  userController.getUserById
);

// Update user role (admin only)
router.put(
  '/:userId/role',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateRoleUpdate,
  userController.updateUserRole
);

// Deactivate user (admin only)
router.put(
  '/:userId/deactivate',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateUserId,
  userController.deactivateUser
);

// Reactivate user (admin only)
router.put(
  '/:userId/reactivate',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateUserId,
  userController.reactivateUser
);

module.exports = router;
// src/api/routes/analytics.routes.js

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// Get supply chain overview
router.get(
  '/overview',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  analyticsController.getSupplyChainOverview
);

// Get product traceability metrics
router.get(
  '/traceability',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getTraceabilityMetrics
);

// Get ethical sourcing metrics
router.get(
  '/ethical-sourcing',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getEthicalSourcingMetrics
);

// Get certification statistics
router.get(
  '/certifications',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getCertificationStatistics
);

// Get user activity metrics
router.get(
  '/user-activity',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateDateRange,
  analyticsController.getUserActivityMetrics
);

// Get product transfer patterns
router.get(
  '/transfer-patterns',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getProductTransferPatterns
);

// Get fraud detection metrics
router.get(
  '/fraud-detection',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getFraudDetectionMetrics
);

// Get sustainability metrics
router.get(
  '/sustainability',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getSustainabilityMetrics
);

// Generate custom report
router.post(
  '/custom-report',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateCustomReportRequest,
  analyticsController.generateCustomReport
);

module.exports = router;
// src/api/controllers/product.controller.js

const productService = require('../services/product.service');
const blockchainService = require('../services/blockchain.service');
const logger = require('../../utils/logger');

exports.createProduct = async (req, res, next) => {
    try {
        const { name, manufacturer, manufacturingDate, batchNumber, ...additionalDetails } = req.body;
        const createdBy = req.user.id;

        const product = await productService.createProduct({
            name,
            manufacturer,
            manufacturingDate,
            batchNumber,
            createdBy,
            ...additionalDetails
        });

        await blockchainService.recordProductCreation(product);

        logger.info(`Product created: ${product.id} by user: ${createdBy}`);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        logger.error(`Error creating product: ${error.message}`);
        next(error);
    }
};

exports.getProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await productService.getProductById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const blockchainData = await blockchainService.getProductData(productId);
        const combinedData = { ...product.toObject(), blockchainData };

        res.status(200).json({ success: true, data: combinedData });
    } catch (error) {
        logger.error(`Error fetching product: ${error.message}`);
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;
        const updatedBy = req.user.id;

        const updatedProduct = await productService.updateProduct(productId, updateData, updatedBy);

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await blockchainService.recordProductUpdate(productId, updateData, updatedBy);

        logger.info(`Product updated: ${productId} by user: ${updatedBy}`);
        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        logger.error(`Error updating product: ${error.message}`);
        next(error);
    }
};

exports.transferProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { newOwner, location } = req.body;
        const transferredBy = req.user.id;

        const transferResult = await productService.transferProduct(productId, newOwner, location, transferredBy);

        if (!transferResult) {
            return res.status(404).json({ success: false, message: 'Product not found or transfer not allowed' });
        }

        await blockchainService.recordProductTransfer(productId, newOwner, location, transferredBy);

        logger.info(`Product transferred: ${productId} to ${newOwner} by user: ${transferredBy}`);
        res.status(200).json({ success: true, data: transferResult });
    } catch (error) {
        logger.error(`Error transferring product: ${error.message}`);
        next(error);
    }
};

exports.verifyProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { verificationCode } = req.body;

        const verificationResult = await blockchainService.verifyProduct(productId, verificationCode);

        if (!verificationResult.isAuthentic) {
            logger.warn(`Failed product verification attempt: ${productId}`);
            return res.status(400).json({ success: false, message: 'Product verification failed', data: verificationResult });
        }

        logger.info(`Product verified: ${productId}`);
        res.status(200).json({ success: true, data: verificationResult });
    } catch (error) {
        logger.error(`Error verifying product: ${error.message}`);
        next(error);
    }
};

exports.getProductHistory = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const history = await blockchainService.getProductHistory(productId);

        if (!history) {
            return res.status(404).json({ success: false, message: 'Product history not found' });
        }

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        logger.error(`Error fetching product history: ${error.message}`);
        next(error);
    }
};

exports.addCertification = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { certificationBody, certificationDate, expirationDate, certificationDetails } = req.body;
        const addedBy = req.user.id;

        const certification = await productService.addCertification(productId, {
            certificationBody,
            certificationDate,
            expirationDate,
            certificationDetails,
            addedBy
        });

        await blockchainService.recordCertification(productId, certification);

        logger.info(`Certification added to product: ${productId} by user: ${addedBy}`);
        res.status(201).json({ success: true, data: certification });
    } catch (error) {
        logger.error(`Error adding certification: ${error.message}`);
        next(error);
    }
};

exports.verifyCertification = async (req, res, next) => {
    try {
        const { productId, certificationId } = req.params;

        const verificationResult = await blockchainService.verifyCertification(productId, certificationId);

        res.status(200).json({ success: true, data: verificationResult });
    } catch (error) {
        logger.error(`Error verifying certification: ${error.message}`);
        next(error);
    }
};

exports.addEthicalScore = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { scoreCategory, score, assessmentDate } = req.body;
        const assessor = req.user.id;

        const ethicalScore = await productService.addEthicalScore(productId, {
            scoreCategory,
            score,
            assessmentDate,
            assessor
        });

        await blockchainService.recordEthicalScore(productId, ethicalScore);

        logger.info(`Ethical score added to product: ${productId} by user: ${assessor}`);
        res.status(201).json({ success: true, data: ethicalScore });
    } catch (error) {
        logger.error(`Error adding ethical score: ${error.message}`);
        next(error);
    }
};

exports.getEthicalProfile = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const ethicalProfile = await blockchainService.getEthicalProfile(productId);

        if (!ethicalProfile) {
            return res.status(404).json({ success: false, message: 'Ethical profile not found' });
        }

        res.status(200).json({ success: true, data: ethicalProfile });
    } catch (error) {
        logger.error(`Error fetching ethical profile: ${error.message}`);
        next(error);
    }
};

exports.searchProducts = async (req, res, next) => {
    try {
        const { query, page, limit, sortBy, sortOrder } = req.query;

        const searchResults = await productService.searchProducts(query, page, limit, sortBy, sortOrder);

        res.status(200).json({ success: true, data: searchResults });
    } catch (error) {
        logger.error(`Error searching products: ${error.message}`);
        next(error);
    }
};

exports.getProductStatistics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const statistics = await productService.getProductStatistics(startDate, endDate);

        res.status(200).json({ success: true, data: statistics });
    } catch (error) {
        logger.error(`Error fetching product statistics: ${error.message}`);
        next(error);
    }
};

const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../utils/errors');

exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password, role, companyName, companyAddress } = req.body;
        
        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) {
            throw new ValidationError('Email already in use');
        }

        const user = await userService.createUser({
            username,
            email,
            password,
            role,
            companyName,
            companyAddress
        });

        const token = authService.generateToken(user);

        logger.info(`New user registered: ${user.id}`);
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        logger.error(`Error registering user: ${error.message}`);
        next(error);
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await userService.getUserByEmail(email);
        if (!user || !(await userService.verifyPassword(user, password))) {
            throw new ValidationError('Invalid credentials');
        }

        if (!user.isActive) {
            throw new ValidationError('Account is deactivated. Please contact support.');
        }

        const token = authService.generateToken(user);

        await userService.updateLastLogin(user.id);

        logger.info(`User logged in: ${user.id}`);
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        logger.error(`Error logging in user: ${error.message}`);
        next(error);
    }
};

exports.getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userService.getUserById(userId);

        if (!user) {
            throw new ValidationError('User not found');
        }

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                companyName: user.companyName,
                companyAddress: user.companyAddress,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        logger.error(`Error fetching user profile: ${error.message}`);
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { username, companyName, companyAddress } = req.body;

        const updatedUser = await userService.updateUser(userId, {
            username,
            companyName,
            companyAddress
        });

        if (!updatedUser) {
            throw new ValidationError('User not found');
        }

        logger.info(`User profile updated: ${userId}`);
        res.status(200).json({
            success: true,
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                companyName: updatedUser.companyName,
                companyAddress: updatedUser.companyAddress
            }
        });
    } catch (error) {
        logger.error(`Error updating user profile: ${error.message}`);
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const user = await userService.getUserById(userId);
        if (!user || !(await userService.verifyPassword(user, currentPassword))) {
            throw new ValidationError('Invalid current password');
 import time
import json
import random
import paho.mqtt.client as mqtt
from datetime import datetime
from gpiozero import DistanceSensor, MotionSensor
import Adafruit_DHT
import RPi.GPIO as GPIO

# MQTT Configuration
MQTT_BROKER = "mqtt.example.com"
MQTT_PORT = 1883
MQTT_TOPIC = "supply_chain/data"
MQTT_CLIENT_ID = f"raspberry-pi-{random.randint(0, 1000)}"

# Sensor Configuration
ULTRASONIC_TRIGGER = 23
ULTRASONIC_ECHO = 24
PIR_PIN = 17
DHT_SENSOR = Adafruit_DHT.DHT22
DHT_PIN = 4
WEIGHT_DATA_PIN = 5
WEIGHT_CLOCK_PIN = 6

class SupplyChainSensor:
    def __init__(self):
        self.distance_sensor = DistanceSensor(echo=ULTRASONIC_ECHO, trigger=ULTRASONIC_TRIGGER)
        self.motion_sensor = MotionSensor(PIR_PIN)
        self.client = mqtt.Client(MQTT_CLIENT_ID)
        self.client.on_connect = self.on_connect
        self.client.on_publish = self.on_publish
        
        # Setup HX711 weight sensor
        GPIO.setmode(GPIO.BCM)
        self.hx = HX711(dout_pin=WEIGHT_DATA_PIN, pd_sck_pin=WEIGHT_CLOCK_PIN)
        self.hx.set_reading_format("MSB", "MSB")
        self.hx.set_reference_unit(1)
        self.hx.reset()
        self.hx.tare()

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker")
        else:
            print(f"Failed to connect, return code {rc}")

    def on_publish(self, client, userdata, mid):
        print(f"Message Published: {mid}")

    def connect_mqtt(self):
        self.client.connect(MQTT_BROKER, MQTT_PORT)
        self.client.loop_start()

    def publish_data(self, data):
        msg = json.dumps(data)
        result = self.client.publish(MQTT_TOPIC, msg)
        status = result[0]
        if status == 0:
            print(f"Sent `{msg}` to topic `{MQTT_TOPIC}`")
        else:
            print(f"Failed to send message to topic {MQTT_TOPIC}")

    def read_sensors(self):
        distance = round(self.distance_sensor.distance * 100, 2)  # cm
        motion = self.motion_sensor.motion_detected
        humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, DHT_PIN)
        weight = max(0, int(self.hx.get_weight(5)))  # grams
        self.hx.power_down()
        self.hx.power_up()
        
        return {
            "timestamp": datetime.now().isoformat(),
            "distance": distance,
            "motion": motion,
            "temperature": round(temperature, 2) if temperature else None,
            "humidity": round(humidity, 2) if humidity else None,
            "weight": weight
        }

    def run(self):
        self.connect_mqtt()
        while True:
            sensor_data = self.read_sensors()
            self.publish_data(sensor_data)
            time.sleep(5)  # Adjust sampling rate as needed

if __name__ == "__main__":
    supply_chain_sensor = SupplyChainSensor()
    try:
        supply_chain_sensor.run()
    except KeyboardInterrupt:
        print("Stopping data collection...")
    finally:
        GPIO.cleanup()
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <HX711.h>

// WiFi and MQTT Configuration
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";
const char* mqtt_server = "mqtt.example.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "supply_chain/data";

// Sensor Configuration
#define DHTPIN 2
#define DHTTYPE DHT22
#define MOTION_SENSOR_PIN 4
#define ULTRASONIC_TRIGGER_PIN 12
#define ULTRASONIC_ECHO_PIN 14
#define WEIGHT_SENSOR_DOUT_PIN 5
#define WEIGHT_SENSOR_SCK_PIN 4

DHT dht(DHTPIN, DHTTYPE);
HX711 scale;

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

float readUltrasonicDistance() {
  digitalWrite(ULTRASONIC_TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIGGER_PIN, LOW);
  
  long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH);
  return (duration * 0.0343) / 2;  // Distance in cm
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  dht.begin();
  pinMode(MOTION_SENSOR_PIN, INPUT);
  pinMode(ULTRASONIC_TRIGGER_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);

  scale.begin(WEIGHT_SENSOR_DOUT_PIN, WEIGHT_SENSOR_SCK_PIN);
  scale.set_scale(2280.f);  // Calibration factor
  scale.tare();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  bool motion = digitalRead(MOTION_SENSOR_PIN);
  float distance = readUltrasonicDistance();
  float weight = scale.get_units(5);

  StaticJsonDocument<200> doc;
  doc["device_id"] = "arduino_001";
  doc["timestamp"] = millis();
  doc["temperature"] = isnan(temperature) ? NULL : temperature;
  doc["humidity"] = isnan(humidity) ? NULL : humidity;
  doc["motion"] = motion;
  doc["distance"] = distance;
  doc["weight"] = weight;

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  client.publish(mqtt_topic, jsonBuffer);
  
  delay(5000);  // Adjust sampling rate as needed
}
#!/bin/bash

# Update and upgrade the system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3-pip git

# Clone the project repository
git clone https://github.com/your-repo/supply-chain-verification.git
cd supply-chain-verification/iot

# Install Python dependencies
pip3 install -r requirements.txt

# Set up Raspberry Pi
if [ "$(uname -m)" == "armv7l" ]; then
    echo "Setting up Raspberry Pi..."
    
    # Enable I2C and SPI interfaces
    sudo raspi-config nonint do_i2c 0
    sudo raspi-config nonint do_spi 0
    
    # Install additional Raspberry Pi specific libraries
    sudo apt install -y python3-rpi.gpio
    pip3 install RPi.GPIO gpiozero
    
    # Set up the data collection script to run on boot
    sudo cp iot/devices/raspberry-pi/data_collection.service /etc/systemd/system/
    sudo systemctl enable data_collection.service
    sudo systemctl start data_collection.service
fi

# Set up Arduino (assuming Arduino IDE is already installed)
if command -v arduino-cli &> /dev/null; then
    echo "Setting up Arduino..."
    
    # Install required Arduino libraries
    arduino-cli lib install ArduinoJson PubSubClient DHT sensor library "Adafruit Unified Sensor" HX711
    
    # Compile and upload the Arduino sketch (replace with your board and port)
    arduino-cli compile --fqbn arduino:avr:uno iot/devices/arduino/sensor_reading.ino
    arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:avr:uno iot/devices/arduino/sensor_reading.ino
fi

# Set up MQTT Broker
echo "Setting up MQTT Broker..."
npm install -g pm2
cd iot/gateway
npm install
pm2 start mqtt-broker.js

# Set up firewall rules
sudo ufw allow 1883
sudo ufw allow 8888

echo "IoT device setup completed!"
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
  if (client && packet.topic === 'supply_chain/data') {
    logger.info(`Message from ${client.id}: ${packet.payload.toString()}`);
    
    try {
      const data = JSON.parse(packet.payload.toString());
      const iotData = new IoTData(data);
      await iotData.save();
      logger.info(`Data saved to MongoDB: ${iotData._id}`);

      // Update blockchain
      await blockchainService.recordIoTData(iotData);

      // Update analytics
      await analyticsService.processIoTData(iotData);

      // Check for anomalies and trigger alerts if necessary
      const anomalies = await analyticsService.detectAnomalies(iotData);
      if (anomalies.length > 0) {
        logger.warn(`Anomalies detected: ${JSON.stringify(anomalies)}`);
        // Trigger alerts (implement alert mechanism here)
      }

    } catch (error) {
      logger.error(`Error processing IoT data: ${error.message}`);
    }
  }
});

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
