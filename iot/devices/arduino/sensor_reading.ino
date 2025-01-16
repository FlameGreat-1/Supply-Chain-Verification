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
