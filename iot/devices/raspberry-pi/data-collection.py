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
