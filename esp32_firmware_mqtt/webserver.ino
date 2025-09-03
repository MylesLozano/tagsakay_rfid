// Web server functionality

void webserver_setup() {
  Serial.println(F("[WebServer] Initializing"));
  
  // Define routes
  
  // Route for root / web page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/index.html", "text/html");
  });
  
  // Route for CSS and JavaScript files
  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/style.css", "text/css");
  });
  
  server.on("/script.js", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/script.js", "text/javascript");
  });
  
  // Route for getting device info
  server.on("/api/info", HTTP_GET, [](AsyncWebServerRequest *request) {
    String info = "{";
    info += "\"deviceId\":\"" + deviceId + "\",";
    info += "\"location\":\"" + deviceLocation + "\",";
    info += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    info += "\"rssi\":" + String(WiFi.RSSI()) + ",";
    info += "\"uptime\":" + String(millis() / 1000) + ",";
    info += "\"wifiConnected\":" + String(wifi_connected ? "true" : "false") + ",";
    info += "\"mqttConnected\":" + String(mqtt_connected ? "true" : "false") + ",";
    info += "\"rfidInitialized\":" + String(rfid_initialized ? "true" : "false") + ",";
    info += "\"freeHeap\":" + String(ESP.getFreeHeap()) + ",";
    info += "\"mqttServer\":\"" + String(MQTT_SERVER) + "\",";
    info += "\"mqttPort\":" + String(MQTT_PORT);
    info += "}";
    
    request->send(200, "application/json", info);
  });
  
  // Route for setting device location
  server.on("/api/location", HTTP_POST, [](AsyncWebServerRequest *request) {
    String response = "{\"success\":false,\"message\":\"Missing parameters\"}";
    
    if (request->hasParam("location", true)) {
      AsyncWebParameter* p = request->getParam("location", true);
      deviceLocation = p->value();
      
      response = "{\"success\":true,\"message\":\"Location updated\",\"location\":\"" + deviceLocation + "\"}";
      
      Serial.print(F("[WebServer] Location updated to: "));
      Serial.println(deviceLocation);
    }
    
    request->send(200, "application/json", response);
  });
  
  // Route for testing display
  server.on("/api/test/display", HTTP_GET, [](AsyncWebServerRequest *request) {
    display_status("Display Test", "This is a test of the display functionality");
    
    request->send(200, "application/json", "{\"success\":true,\"message\":\"Display test triggered\"}");
  });
  
  // Route for testing buzzer
  server.on("/api/test/buzzer", HTTP_GET, [](AsyncWebServerRequest *request) {
    buzzer_play_notification();
    
    request->send(200, "application/json", "{\"success\":true,\"message\":\"Buzzer test triggered\"}");
  });
  
  // Route for testing RFID
  server.on("/api/test/rfid", HTTP_GET, [](AsyncWebServerRequest *request) {
    bool success = rfid_self_test();
    
    String response = "{\"success\":" + String(success ? "true" : "false") + ",";
    response += "\"message\":\"RFID self-test " + String(success ? "passed" : "failed") + "\"}";
    
    request->send(200, "application/json", response);
  });
  
  // Route for testing MQTT
  server.on("/api/test/mqtt", HTTP_GET, [](AsyncWebServerRequest *request) {
    bool success = false;
    
    if (mqtt_connected) {
      // Publish a test message
      success = mqttClient.publish(MQTT_TOPIC_STATUS, "{\"deviceId\":\"" + deviceId + "\",\"status\":\"test\"}");
    }
    
    String response = "{\"success\":" + String(success ? "true" : "false") + ",";
    response += "\"message\":\"MQTT test " + String(success ? "message sent" : "failed - not connected") + "\"}";
    
    request->send(200, "application/json", response);
  });
  
  // Route for triggering a reboot
  server.on("/api/reboot", HTTP_POST, [](AsyncWebServerRequest *request) {
    shouldReboot = true;
    
    request->send(200, "application/json", "{\"success\":true,\"message\":\"Device will reboot now\"}");
  });
  
  // Route for OTA update
  server.on("/api/ota", HTTP_POST, [](AsyncWebServerRequest *request) {
    // OTA completed
    shouldReboot = !Update.hasError();
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", shouldReboot ? "Update Success! Rebooting..." : "Update Failed!");
    response->addHeader("Connection", "close");
    request->send(response);
  }, [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
    // OTA in progress
    if (!index) {
      // Start OTA mode
      otaMode = true;
      display_status("OTA Update", "Updating firmware...");
      
      Serial.printf("[OTA] Update started: %s\n", filename.c_str());
      if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
        Update.printError(Serial);
      }
    }
    
    // Write firmware chunk
    if (Update.write(data, len) != len) {
      Update.printError(Serial);
    }
    
    // If final chunk, end the update
    if (final) {
      if (Update.end(true)) {
        Serial.printf("[OTA] Update Success: %uB\n", index + len);
        display_status("OTA Update", "Success! Rebooting...");
      } else {
        Update.printError(Serial);
        display_error("OTA Failed");
        otaMode = false;
      }
    }
  });
  
  // Start server
  server.begin();
  
  Serial.println(F("[WebServer] Started"));
}
