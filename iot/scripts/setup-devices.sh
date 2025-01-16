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
