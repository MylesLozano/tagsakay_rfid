// Display functionality

void display_setup() {
  Serial.println(F("[DISPLAY] Initializing"));
  display.init();
  display.flipScreenVertically();
  display.setFont(ArialMT_Plain_10);
  display.setTextAlignment(TEXT_ALIGN_CENTER);
  display.clear();
  
  // Display startup screen
  display.setFont(ArialMT_Plain_16);
  display.drawString(64, 5, "TagSakay");
  display.setFont(ArialMT_Plain_10);
  display.drawString(64, 30, "RFID Reader");
  display.drawString(64, 45, "Initializing...");
  display.display();
}

void display_connecting() {
  display.clear();
  display.setFont(ArialMT_Plain_10);
  display.drawString(64, 10, "Connecting to WiFi");
  display.drawString(64, 25, WIFI_SSID);
  
  // Show a simple animation
  static int dotCount = 0;
  String dots = "";
  for (int i = 0; i < dotCount; i++) {
    dots += ".";
  }
  dotCount = (dotCount + 1) % 4;
  
  display.drawString(64, 40, dots);
  display.display();
  delay(300); // Small delay for animation
}

void display_connected() {
  display.clear();
  display.setFont(ArialMT_Plain_10);
  display.drawString(64, 10, "Connected to WiFi");
  display.drawString(64, 25, "IP:");
  display.drawString(64, 40, WiFi.localIP().toString());
  display.display();
}

void display_ready() {
  display.clear();
  display.setFont(ArialMT_Plain_16);
  display.drawString(64, 5, "TagSakay");
  display.setFont(ArialMT_Plain_10);
  display.drawString(64, 25, "Ready for scan");
  display.drawString(64, 40, "Device: " + deviceId);
  display.display();
}

void display_scanning() {
  display.clear();
  display.setFont(ArialMT_Plain_16);
  display.drawString(64, 5, "Scanning");
  display.setFont(ArialMT_Plain_10);
  display.drawString(64, 30, "Processing...");
  display.display();
}

void display_success(String userName, String eventType) {
  display.clear();
  display.setFont(ArialMT_Plain_16);
  display.drawString(64, 5, "Success!");
  
  display.setFont(ArialMT_Plain_10);
  display.drawString(64, 30, "Welcome, " + userName);
  
  String eventMessage = "Unknown";
  if (eventType == "entry") {
    eventMessage = "Entry Recorded";
  } else if (eventType == "exit") {
    eventMessage = "Exit Recorded";
  }
  
  display.drawString(64, 45, eventMessage);
  display.display();
}

void display_error(String errorMessage) {
  display.clear();
  display.setFont(ArialMT_Plain_16);
  display.drawString(64, 5, "Error");
  
  // If error message is too long, truncate it
  if (errorMessage.length() > 20) {
    errorMessage = errorMessage.substring(0, 17) + "...";
  }
  
  display.setFont(ArialMT_Plain_10);
  display.drawString(64, 30, errorMessage);
  display.display();
}

void invert_display_periodically() {
  static long last_inversion_time = 0;
  static bool inverted = false;
  
  if (millis() - last_inversion_time > DISPLAY_INVERSION_PERIOD) {
    last_inversion_time = millis();
    inverted = !inverted;
    display.invertDisplay(inverted);
  }
}
