# ESP32 RFID Scanner for TagSakay

This document provides instructions for setting up and using the ESP32 RFID Scanner for the TagSakay system.

## Hardware Requirements

- ESP32 development board (ESP32-WROOM, ESP32-WROVER, etc.)
- PN532 RFID/NFC reader
- Micro USB cable for programming and power
- RFID tags/cards (ISO14443A compatible)
- Jumper wires
- Optional: LEDs for status indication

## Wiring Instructions

### PN532 RFID Reader to ESP32 (SPI Connection)

| PN532 Pin | ESP32 Pin |
|-----------|-----------|
| SCK       | GPIO 18   |
| MISO      | GPIO 19   |
| MOSI      | GPIO 23   |
| SS        | GPIO 5    |
| VCC       | 3.3V      |
| GND       | GND       |

### PN532 RFID Reader to ESP32 (I2C Connection)

| PN532 Pin | ESP32 Pin |
|-----------|-----------|
| SDA       | GPIO 21   |
| SCL       | GPIO 22   |
| IRQ       | GPIO 2    |
| VCC       | 3.3V      |
| GND       | GND       |

## Software Requirements

1. [Arduino IDE](https://www.arduino.cc/en/software) (or Arduino CLI, Platform.io)
2. ESP32 Board support package
3. Required libraries:
   - WiFi (included with ESP32 package)
   - HTTPClient (included with ESP32 package)
   - ArduinoJson
   - Adafruit_PN532

## Installation Instructions

1. Install the Arduino IDE
2. Add ESP32 board support:
   - Open Arduino IDE
   - Go to File > Preferences
   - Add this URL to the "Additional Boards Manager URLs" field:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to Tools > Board > Boards Manager
   - Search for "esp32" and install the latest version

3. Install required libraries:
   - Go to Tools > Manage Libraries
   - Search for and install:
     - ArduinoJson
     - Adafruit PN532

4. Download the ESP32_PN532_RFID_Scanner.ino sketch from this repository

## Configuration

Before uploading the sketch, you must configure the following settings:

1. WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. TagSakay API configuration:
   ```cpp
   const char* apiUrl = "http://YOUR_SERVER_IP:3000/api/rfid/scan";
   const char* apiKey = "YOUR_API_KEY"; // Replace with your generated API key
   const char* deviceId = "ESP32-PN532-001"; // Should match the Device ID used when creating the API key
   ```

3. Connection type (SPI or I2C):
   - For SPI (default), uncomment the SPI configuration and comment out the I2C configuration
   - For I2C, comment out the SPI configuration and uncomment the I2C configuration

## Generating an API Key

To generate an API key for your ESP32 device:

1. Log in to the TagSakay web interface
2. Navigate to "API Key Management" 
3. Click "Create New API Key"
4. Fill in the following:
   - Name: Give your key a descriptive name (e.g., "PN532 RFID Scanner")
   - Device ID: Provide a unique identifier (e.g., "ESP32-PN532-001")
   - Description: Optional details about the device
5. Click "Create"
6. Copy the displayed API key and save it somewhere secure
7. Update the `apiKey` variable in the sketch with this value

## Uploading the Sketch

1. Connect your ESP32 to your computer via USB
2. Select the correct board from Tools > Board > ESP32 Arduino
3. Select the correct port from Tools > Port
4. Click the Upload button

## Operation

Once programmed, the ESP32 will:

1. Connect to the specified WiFi network
2. Initialize the PN532 RFID reader
3. Continuously scan for RFID tags
4. When a tag is detected, it will:
   - Read the tag's UID
   - Send the UID to the TagSakay backend server
   - Display the result on the serial monitor
   - Indicate status via the LED (if connected)

### LED Status Indicators

- **LED Off**: WiFi disconnected
- **LED Slow Blinking**: WiFi connected but server unreachable
- **LED On Solid**: Both WiFi and server connected
- **LED Quick Blink (2x)**: Successful tag scan
- **LED Quick Blink (3x)**: Error during tag scan

## Troubleshooting

- **PN532 not detected**: Check wiring connections and ensure correct interface is selected in code
- **WiFi connection fails**: Verify SSID and password
- **Cannot connect to server**: Check server URL and ensure the server is running
- **API key rejected**: Generate a new API key and update the sketch

## Additional Information

- The device will attempt to reconnect to WiFi if the connection is lost
- The device will check the server connection periodically
- To change the read interval, update the `TAG_READ_DELAY` constant
- For debug information, monitor the serial output at 115200 baud