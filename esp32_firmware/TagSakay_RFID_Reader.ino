/*
 * TagSakay RFID Reader Firmware
 * 
 * This firmware is designed for ESP32 devices with MFRC522 RFID readers.
 * It allows for secure communication with the TagSakay backend system
 * using API key authentication for device identification.
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

// Import credentials (create this file with your specific settings)
#include "credentials.h"
// Import fonts and images for the display
#include "images.h"

// API parameters
#define API_URL "http://your-backend-url/api/v1/rfid/scan"
#define TRANSACTION_DESCRIPTION "TagSakay RFID Scan"

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

// Create MFRC522 instance
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN); 

// Create display instance
SSD1306 display(0x3c, SDA_PIN, SCL_PIN);

// Web server for OTA updates and configuration
WebServer webServer(80);

// Global variables for wifi management
boolean wifi_connected = false;
long wifi_disconnected_time = 0;

// Device settings
String deviceId = "ESP32_RFID_001"; // This should be set uniquely for each device
String deviceLocation = "Bus_001";   // This can be configured based on where the device is installed

void setup() {
  delay(100);
  Serial.begin(115200);
  Serial.println(F("\n\n===== TagSakay RFID Reader ====="));
  
  // Initialize components
  wifi_setup();
  display_setup();
  buzzer_setup();
  rfid_setup();
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

    // Check for cards
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      // Inform user that card is detected
      display_scanning();
      buzzer_play_request_pending();

      // Read the card UID
      String card_UID = UID_as_string(mfrc522.uid.uidByte, UID_SIZE);
      Serial.print(F("[RFID] Card UID: "));
      Serial.println(card_UID);

      // Make the API call
      API_call(card_UID);
  
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
