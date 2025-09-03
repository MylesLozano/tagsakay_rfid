# TagSakay ESP32 RFID Reader

This is the firmware for ESP32 devices equipped with an MFRC522 RFID reader for the TagSakay system. The firmware allows for secure scanning of RFID cards, communication with the TagSakay backend using API key authentication, and provides a web interface for configuration and updates.

## Hardware Requirements

- ESP32 development board
- MFRC522 RFID reader module
- SSD1306 OLED display (128x64)
- Buzzer for audible feedback
- Jumper wires and breadboard for prototyping

## Pin Configuration

The firmware uses the following pin configuration by default:

### OLED Display (I2C)

- SDA: GPIO5
- SCL: GPIO4

### MFRC522 RFID Reader (SPI)

- RST: GPIO16
- SDA (SS/CS): GPIO15
- SCK: GPIO14
- MOSI: GPIO13
- MISO: GPIO12

### Buzzer

- GPIO25

## Setup Instructions

1. **Install the required libraries:**

   - ESP32 board for Arduino IDE
   - MFRC522 library
   - SSD1306 library
   - ArduinoJson library

2. **Configure your credentials:**

   - Copy `credentials.h.sample` to `credentials.h`
   - Update with your WiFi SSID, password, and API key

3. **Update the API URL:**

   - Change the `API_URL` defined in the main file to point to your TagSakay backend

4. **Compile and upload:**
   - Connect your ESP32 to your computer
   - Select the appropriate board and port in Arduino IDE
   - Upload the firmware

## Features

- **RFID Scanning:** Scans RFID cards and sends data to the backend
- **API Key Authentication:** Uses secure API key authentication to communicate with backend
- **OLED Display:** Shows device status, scan results, and error messages
- **Web Interface:** Allows for firmware updates, configuration, and status monitoring
- **OTA Updates:** Enables firmware updates over WiFi
- **Self-Test:** Periodically checks RFID reader functionality

## Web Interface

The device provides a web interface accessible from any browser on the same network. Navigate to the IP address displayed on the OLED screen to access:

- **Home:** Shows device status and information
- **Configuration:** Configure device ID and location
- **Update:** Upload new firmware
- **Reboot:** Restart the device
- **Status:** View detailed status information in JSON format

## API Communication

The device communicates with the TagSakay backend using HTTP POST requests with JSON payloads. Each request includes:

- RFID tag ID
- Device ID
- Location
- Additional metadata

The API key is sent in the request header for authentication.

## Troubleshooting

If the device is not working properly:

1. **Check the OLED display for error messages**
2. **Verify WiFi connection:**
   - Ensure SSID and password are correct
   - Check signal strength
3. **Verify API communication:**
   - Ensure API key is valid
   - Check backend URL is correct and accessible
4. **RFID reader issues:**
   - Check connections
   - Verify card compatibility (Mifare Classic recommended)
5. **Use the web interface status page for diagnostics**

## Contributing

To contribute to this firmware:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[MIT License](LICENSE)

---

For more information, visit the [TagSakay Project Website](https://tagsakay.example.com)
