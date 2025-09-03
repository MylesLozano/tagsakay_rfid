// WiFi functionality

void wifi_setup() {
  Serial.println(F("[WiFi] Initializing"));
  
  // Set WiFi mode
  WiFi.mode(WIFI_STA);
  
  // Set hostname
  WiFi.setHostname(deviceId.c_str());
  
  // Connect to WiFi
  Serial.print(F("[WiFi] Connecting to "));
  Serial.println(WIFI_SSID);
  
  // Show connection attempt on display
  display_status("WiFi", "Connecting...");
  
  // Start connection
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  // Wait for connection (with timeout)
  unsigned long start_time = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start_time < 10000) {
    delay(500);
    Serial.print(".");
  }
  
  // Check connection result
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print(F("[WiFi] Connected, IP address: "));
    Serial.println(WiFi.localIP());
    
    // Update display with WiFi info
    display_wifi_info();
    delay(2000);  // Show WiFi info for 2 seconds
    
    wifi_connected = true;
  } else {
    Serial.println();
    Serial.println(F("[WiFi] Connection failed"));
    
    display_error("WiFi Connect Failed");
    wifi_connected = false;
  }
}

void wifi_maintain_connection() {
  // Check WiFi connection every 10 seconds
  unsigned long current_time = millis();
  if (current_time - last_wifi_check > 10000) {
    last_wifi_check = current_time;
    
    if (WiFi.status() != WL_CONNECTED) {
      if (wifi_connected) {
        // Just lost connection
        Serial.println(F("[WiFi] Connection lost, reconnecting..."));
        display_status("WiFi", "Reconnecting...");
        wifi_connected = false;
      }
      
      // Try to reconnect
      WiFi.reconnect();
      
      // Give it a moment to connect
      delay(500);
      
      // Update status
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println(F("[WiFi] Reconnected"));
        display_status("WiFi", "Reconnected");
        wifi_connected = true;
      }
    } else if (!wifi_connected) {
      // Just got connected
      Serial.println(F("[WiFi] Connected"));
      display_status("WiFi", "Connected");
      wifi_connected = true;
    }
  }
}
