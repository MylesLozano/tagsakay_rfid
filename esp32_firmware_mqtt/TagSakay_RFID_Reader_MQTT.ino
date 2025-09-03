/*
 * TagSakay RFID Reader Firmware with MQTT Support
 * 
 * This firmware is designed for ESP32 devices with MFRC522 RFID readers.
 * It allows for secure communication with the TagSakay backend system
 * using either MQTT or HTTP API calls for maximum flexibility and efficiency.
 * 
 * Board type: ESP32 Dev Module
 */

// Libraries
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <Update.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include "SSD1306.h"
#include <PubSubClient.h>  // MQTT client library

// Import credentials (create this file with your specific settings)
#include "credentials.h"
// Import fonts and images for the display
#include "images.h"

// API parameters
#define HTTP_API_URL "http://your-backend-url/api/v1/rfid/scan"
#define TRANSACTION_DESCRIPTION "TagSakay RFID Scan"

// MQTT Settings
#define MQTT_SERVER "your-mqtt-server.com"
#define MQTT_PORT 1883
#define MQTT_TOPIC_SCAN "tagsakay/rfid/scan"
#define MQTT_TOPIC_RESPONSE "tagsakay/rfid/response"
#define MQTT_TOPIC_STATUS "tagsakay/device/status"
#define MQTT_KEEPALIVE 60

// Communication Method
#define USE_MQTT true  // Set to false to use HTTP instead of MQTT

// Wifi settings
#define WIFI_CONNECTION_TIMEOUT 10000

// IO Pins
#define SDA_PIN 5
#define SCL_PIN 4

#define SPI_SCK_PIN 14
#define SPI_MISO_PIN 12
#define SPI_MOSI_PIN 13

#define RFID_RST_PIN 16
#define RFID_SS_PIN 15
#define BUZZER_PIN 25

// Display parameters
#define DISPLAY_WIDTH 128
#define DISPLAY_HEIGHT 64
#define DISPLAY_MESSAGE_LENGTH 3000
#define DISPLAY_INVERSION_PERIOD 60000

// Buzzer parameters
#define BUZZER_CHANNEL 0
#define BUZZER_RESOLUTION 8

// RFID parameters
#define UID_SIZE 4
#define RFID_SELF_TEST_PERIOD 5000

// Status check parameters
#define STATUS_REPORT_INTERVAL 60000  // Send status update every 60 seconds

// Create MFRC522 instance
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN); 

// Create display instance
SSD1306 display(0x3c, SDA_PIN, SCL_PIN);

// Web server for OTA updates and configuration
WebServer webServer(80);

// WiFi client for MQTT
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Global variables for wifi management
boolean wifi_connected = false;
long wifi_disconnected_time = 0;

// MQTT variables
boolean mqtt_connected = false;
long last_mqtt_connection_attempt = 0;
#define MQTT_RECONNECT_DELAY 5000

// Status reporting
long last_status_report = 0;

// Device settings
String deviceId = "ESP32_RFID_001"; // This should be set uniquely for each device
String deviceLocation = "Bus_001";   // This can be configured based on where the device is installed

void setup() {
  delay(100);
  Serial.begin(115200);
  Serial.println(F("\n\n===== TagSakay RFID Reader with MQTT ====="));
  
  // Initialize components
  wifi_setup();
  display_setup();
  buzzer_setup();
  rfid_setup();
  mqtt_setup();
  web_server_setup();
  
  Serial.println(F("Initialization complete"));
}

void loop() {
  // Check for WiFi
  if (WiFi.status() != WL_CONNECTED) {
    // Wifi disconnected
    if (wifi_connected) {
      // Acknowledge disconnection
      wifi_connected = false;
      wifi_disconnected_time = millis();
      Serial.println(F("[WIFI] disconnected"));
      mqtt_connected = false;
    }

    wifi_reset_if_timeout();
    display_connecting();
  } 
  else {
    // Wifi connected
    if (!wifi_connected) {
      // Acknowledge connection
      wifi_connected = true;
      Serial.print(F("[WIFI] connected, IP: "));
      Serial.println(WiFi.localIP());
      display_connected();
      delay(2000);
      display_ready();
    }

    // Handle MQTT connection if using MQTT
    if (USE_MQTT) {
      mqtt_maintain_connection();
    }

    // Send periodic status updates
    if (millis() - last_status_report > STATUS_REPORT_INTERVAL) {
      last_status_report = millis();
      send_status_update();
    }

    // Check for cards
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      // Inform user that card is detected
      display_scanning();
      buzzer_play_request_pending();

      // Read the card UID
      String card_UID = UID_as_string(mfrc522.uid.uidByte, UID_SIZE);
      Serial.print(F("[RFID] Card UID: "));
      Serial.println(card_UID);

      // Send the card data
      if (USE_MQTT && mqtt_connected) {
        mqtt_send_scan(card_UID);
      } else {
        http_send_scan(card_UID);
      }
  
      // Stop reading the card
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();

      // Wait some more
      delay(DISPLAY_MESSAGE_LENGTH);
  
      // Return to showing ready screen
      display_ready();
    }
  }

  // Perform periodic tasks
  invert_display_periodically();
  rfid_periodic_self_test();
  
  // Handle MQTT client loop
  if (USE_MQTT && mqtt_connected) {
    mqttClient.loop();
  }
  
  // Handle web server
  webServer.handleClient();
}

// Convert RFID UID bytes to a readable string
String UID_as_string(byte *buffer, byte bufferSize) {
  String UID = "";
  
  for (byte i = 0; i < bufferSize; i++) {
    // Add leading zero for values less than 0x10
    if (buffer[i] < 0x10) {
      UID += "0";
    }
    UID += String(buffer[i], HEX);
  }
  
  UID.toUpperCase();
  return UID;
}

// Send device status update
void send_status_update() {
  if (USE_MQTT && mqtt_connected) {
    // Create a JSON status message
    StaticJsonDocument<400> statusDoc;
    
    statusDoc["deviceId"] = deviceId;
    statusDoc["location"] = deviceLocation;
    statusDoc["ip"] = WiFi.localIP().toString();
    statusDoc["rssi"] = WiFi.RSSI();
    statusDoc["uptime"] = millis() / 1000;
    statusDoc["freeHeap"] = ESP.getFreeHeap();
    statusDoc["rfidStatus"] = mfrc522.PCD_PerformSelfTest() ? "OK" : "ERROR";
    
    char statusBuffer[400];
    serializeJson(statusDoc, statusBuffer, sizeof(statusBuffer));
    
    // Publish status update
    mqttClient.publish(MQTT_TOPIC_STATUS, statusBuffer);
    Serial.println(F("[MQTT] Status update sent"));
    
    // Reinit RFID after self-test
    mfrc522.PCD_Init();
  }
}
