# TagSakay RFID Reader with MQTT

This firmware implements an RFID reader system for the TagSakay project using an ESP32 microcontroller, MFRC522 RFID reader, and SSD1306 OLED display. It communicates with the TagSakay backend server using MQTT protocol for improved efficiency and reduced latency compared to HTTP.

## Features

- RFID card detection and processing using MFRC522 module
- OLED display for status information and user feedback
- WiFi connectivity with automatic reconnection
- MQTT communication with the TagSakay backend
- Buzzer for audio feedback
- Web interface for configuration and management
- OTA (Over-The-Air) firmware updates
- Automatic reconnection for both WiFi and MQTT

## Hardware Requirements

- ESP32 Development Board
- MFRC522 RFID Reader (connected via SPI)
- SSD1306 OLED Display (128x64, connected via I2C)
- Buzzer for audio feedback
- LED for status indication (built-in LED is used by default)

## Pin Configuration

| Component        | ESP32 Pin        |
| ---------------- | ---------------- |
| MFRC522 SDA (SS) | 5                |
| MFRC522 SCK      | 18 (default SPI) |
| MFRC522 MOSI     | 23 (default SPI) |
| MFRC522 MISO     | 19 (default SPI) |
| MFRC522 RST      | 27               |
| SSD1306 SDA      | 21 (default I2C) |
| SSD1306 SCL      | 22 (default I2C) |
| Buzzer           | 25               |
| Status LED       | 2 (built-in)     |

## Software Dependencies

The following Arduino libraries are required:

- WiFi.h (built-in ESP32)
- PubSubClient (for MQTT)
- SPI.h (built-in Arduino)
- MFRC522 (by GithubCommunity)
- Wire.h (built-in Arduino)
- Adafruit_GFX (by Adafruit)
- Adafruit_SSD1306 (by Adafruit)
- ArduinoJson (by Benoit Blanchon)
- ESPAsyncWebServer (by me-no-dev)
- AsyncTCP (by me-no-dev)
- SPIFFS (built-in ESP32)
- Update.h (built-in ESP32)

## Installation

1. Install the Arduino IDE
2. Add ESP32 board support to Arduino IDE
3. Install all required libraries using the Library Manager
4. Rename `credentials.h.sample` to `credentials.h` and update with your credentials
5. Connect your ESP32 board
6. Upload the sketch

## Configuration

The device can be configured via the web interface or by editing the `credentials.h` file. The following settings can be configured:

- WiFi SSID and password
- MQTT server address, port, username, and password
- Device location

### Web Interface

The web interface can be accessed by navigating to the IP address of the ESP32 in a web browser. The following features are available:

- View device information and status
- Set device location
- Test display, buzzer, RFID reader, and MQTT connection
- Trigger a device reboot
- Upload new firmware (OTA update)

## MQTT Topics

The device uses the following MQTT topics:

- `tagsakay/scan` - Published when an RFID card is scanned
- `tagsakay/response` - Subscribed to receive responses from the backend
- `tagsakay/status` - Published for device status updates

## MQTT Message Format

### Scan Message (Published)

```json
{
  "tagId": "ABCD1234",
  "deviceId": "ESP32_RFID_12345",
  "location": "Bus Terminal",
  "timestamp": 1234567890,
  "metadata": {
    "firmware": "1.0.0",
    "scanType": "regular"
  }
}
```

### Response Message (Received)

```json
{
  "success": true,
  "data": {
    "user": {
      "name": "John Doe",
      "id": "123"
    },
    "eventType": "entry"
  }
}
```

### Status Message (Published)

```json
{
  "deviceId": "ESP32_RFID_12345",
  "status": "online",
  "location": "Bus Terminal"
}
```

## Advantages of MQTT Over HTTP

1. **Lower Overhead**: MQTT has a much smaller header size compared to HTTP, reducing bandwidth usage.
2. **Persistent Connection**: MQTT maintains a persistent connection, eliminating the need to establish a new connection for each request.
3. **Bidirectional Communication**: MQTT allows the server to push messages to clients without polling.
4. **Lower Latency**: Due to reduced overhead and persistent connections, MQTT generally has lower latency.
5. **Better for Unreliable Networks**: MQTT includes built-in mechanisms for handling network interruptions.
6. **Efficient Battery Usage**: The lightweight nature of MQTT results in less power consumption, extending battery life.

## Troubleshooting

- **Device not connecting to WiFi**: Check your credentials.h file for correct SSID and password
- **MQTT connection fails**: Verify MQTT server address, port, username, and password
- **RFID reader not detecting cards**: Check wiring connections to the MFRC522 module
- **Display not working**: Ensure I2C wiring is correct and the display address matches your hardware

## License

This project is licensed under the MIT License - see the LICENSE file for details.
