// Display functionality

void display_setup() {
  Serial.println(F("[Display] Initializing"));
  
  // Initialize the display
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("[Display] Initialization failed"));
    return;
  }
  
  // Clear the display buffer
  display.clearDisplay();
  display.display();
  
  // Set text properties
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  
  Serial.println(F("[Display] Initialized"));
}

void display_splash_screen() {
  display.clearDisplay();
  
  // Draw logo from images.h
  display.drawBitmap(
    (SCREEN_WIDTH - LOGO_WIDTH) / 2,
    (SCREEN_HEIGHT - LOGO_HEIGHT) / 2 - 10,
    logo_bmp, LOGO_WIDTH, LOGO_HEIGHT, 1);
  
  // Draw text below logo
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor((SCREEN_WIDTH - 98) / 2, SCREEN_HEIGHT - 20);
  display.println(F("TagSakay RFID Reader"));
  
  display.setCursor((SCREEN_WIDTH - 76) / 2, SCREEN_HEIGHT - 10);
  display.println(F("MQTT Version 1.0"));
  
  display.display();
  delay(2000);
}

void display_status(String title, String message) {
  display.clearDisplay();
  
  // Draw header
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(title);
  
  // Draw separator line
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Draw message
  display.setCursor(0, 16);
  display.println(message);
  
  // Draw connection status indicators
  display.setCursor(0, SCREEN_HEIGHT - 20);
  display.print(F("WiFi: "));
  display.println(wifi_connected ? F("Connected") : F("Disconnected"));
  
  display.setCursor(0, SCREEN_HEIGHT - 10);
  display.print(F("MQTT: "));
  display.println(mqtt_connected ? F("Connected") : F("Disconnected"));
  
  display.display();
}

void display_reading() {
  display.clearDisplay();
  
  // Draw reading icon (circle with spinning animation)
  int radius = 10;
  int centerX = SCREEN_WIDTH / 2;
  int centerY = SCREEN_HEIGHT / 2 - 10;
  
  display.drawCircle(centerX, centerY, radius, SSD1306_WHITE);
  
  // Draw spinning indicator
  float angle = (millis() % 1000) / 1000.0 * 2 * PI;
  int indicatorX = centerX + cos(angle) * radius;
  int indicatorY = centerY + sin(angle) * radius;
  display.fillCircle(indicatorX, indicatorY, 3, SSD1306_WHITE);
  
  // Draw text
  display.setTextSize(1);
  display.setCursor((SCREEN_WIDTH - 78) / 2, centerY + radius + 5);
  display.println(F("Reading card..."));
  
  display.display();
}

void display_success(String userName, String eventType) {
  display.clearDisplay();
  
  // Draw success icon (checkmark)
  display.drawBitmap(
    (SCREEN_WIDTH - CHECK_WIDTH) / 2,
    5,
    check_bmp, CHECK_WIDTH, CHECK_HEIGHT, 1);
  
  // Draw user name
  display.setTextSize(1);
  display.setCursor(0, 30);
  display.println(F("Welcome:"));
  
  display.setTextSize(1);
  // Center the user name
  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(userName, 0, 0, &x1, &y1, &w, &h);
  display.setCursor((SCREEN_WIDTH - w) / 2, 42);
  display.println(userName);
  
  // Draw event type
  display.setTextSize(1);
  display.setCursor(0, 56);
  display.print(F("Event: "));
  display.println(eventType);
  
  display.display();
  delay(3000);  // Show success message for 3 seconds
  
  // Return to status screen
  display_status("Ready", "Waiting for card");
}

void display_error(String errorMessage) {
  display.clearDisplay();
  
  // Draw error icon (X)
  display.drawBitmap(
    (SCREEN_WIDTH - X_WIDTH) / 2,
    5,
    x_bmp, X_WIDTH, X_HEIGHT, 1);
  
  // Draw error message
  display.setTextSize(1);
  display.setCursor(0, 30);
  display.println(F("Error:"));
  
  display.setTextSize(1);
  // Center and truncate the error message if needed
  if (errorMessage.length() > 21) {
    errorMessage = errorMessage.substring(0, 18) + "...";
  }
  
  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(errorMessage, 0, 0, &x1, &y1, &w, &h);
  display.setCursor((SCREEN_WIDTH - w) / 2, 42);
  display.println(errorMessage);
  
  display.display();
  delay(3000);  // Show error message for 3 seconds
  
  // Return to status screen
  display_status("Ready", "Waiting for card");
}

void display_wifi_info() {
  display.clearDisplay();
  
  // Draw header
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("WiFi Information"));
  
  // Draw separator line
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Draw WiFi information
  display.setCursor(0, 16);
  display.print(F("SSID: "));
  display.println(WiFi.SSID());
  
  display.setCursor(0, 26);
  display.print(F("IP: "));
  display.println(WiFi.localIP().toString());
  
  display.setCursor(0, 36);
  display.print(F("RSSI: "));
  display.print(WiFi.RSSI());
  display.println(F(" dBm"));
  
  display.setCursor(0, 46);
  display.print(F("Device ID: "));
  display.println(deviceId);
  
  display.display();
}
