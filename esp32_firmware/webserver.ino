// Web server functionality for OTA updates and configuration

void web_server_setup() {
  Serial.println(F("[WEBSERVER] Initializing"));
  
  // Define server routes
  webServer.on("/", HTTP_GET, handle_root);
  webServer.on("/update", HTTP_GET, handle_update_form);
  webServer.on("/update", HTTP_POST, handle_update_result, handle_update_file_upload);
  webServer.on("/reboot", HTTP_GET, handle_reboot_form);
  webServer.on("/reboot", HTTP_POST, handle_reboot);
  webServer.on("/config", HTTP_GET, handle_config_form);
  webServer.on("/config", HTTP_POST, handle_config_save);
  webServer.on("/status", HTTP_GET, handle_status);
  
  // Start server
  webServer.begin();
  Serial.println(F("[WEBSERVER] HTTP server started"));
}

void handle_root() {
  String html = "<html><head><title>TagSakay RFID Reader</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }";
  html += "h1 { color: #0066cc; }";
  html += "nav { background: #f8f8f8; padding: 10px; margin-bottom: 20px; }";
  html += "nav a { margin-right: 15px; color: #0066cc; text-decoration: none; }";
  html += "nav a:hover { text-decoration: underline; }";
  html += ".container { max-width: 800px; margin: 0 auto; }";
  html += "table { width: 100%; border-collapse: collapse; }";
  html += "table, th, td { border: 1px solid #ddd; }";
  html += "th, td { padding: 8px; text-align: left; }";
  html += "tr:nth-child(even) { background-color: #f2f2f2; }";
  html += "</style>";
  html += "</head><body>";
  html += "<div class='container'>";
  html += "<h1>TagSakay RFID Reader</h1>";
  
  html += "<nav>";
  html += "<a href='/'>Home</a>";
  html += "<a href='/update'>Update Firmware</a>";
  html += "<a href='/config'>Configuration</a>";
  html += "<a href='/reboot'>Reboot</a>";
  html += "<a href='/status'>Status</a>";
  html += "</nav>";
  
  html += "<h2>Device Information</h2>";
  html += "<table>";
  html += "<tr><td>Device ID</td><td>" + deviceId + "</td></tr>";
  html += "<tr><td>Location</td><td>" + deviceLocation + "</td></tr>";
  html += "<tr><td>IP Address</td><td>" + WiFi.localIP().toString() + "</td></tr>";
  html += "<tr><td>MAC Address</td><td>" + WiFi.macAddress() + "</td></tr>";
  html += "<tr><td>WiFi SSID</td><td>" + String(WIFI_SSID) + "</td></tr>";
  html += "<tr><td>WiFi Signal</td><td>" + String(WiFi.RSSI()) + " dBm</td></tr>";
  html += "<tr><td>Uptime</td><td>" + format_uptime(millis()) + "</td></tr>";
  html += "</table>";
  
  html += "</div></body></html>";
  
  webServer.send(200, "text/html", html);
}

void handle_update_form() {
  String html = "<html><head><title>Update Firmware</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }";
  html += "h1 { color: #0066cc; }";
  html += "nav { background: #f8f8f8; padding: 10px; margin-bottom: 20px; }";
  html += "nav a { margin-right: 15px; color: #0066cc; text-decoration: none; }";
  html += "nav a:hover { text-decoration: underline; }";
  html += ".container { max-width: 800px; margin: 0 auto; }";
  html += "form { background: #f8f8f8; padding: 15px; border-radius: 5px; }";
  html += "input[type=file] { margin: 10px 0; }";
  html += "input[type=submit] { background: #0066cc; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }";
  html += "</style>";
  html += "</head><body>";
  html += "<div class='container'>";
  html += "<h1>Update Firmware</h1>";
  
  html += "<nav>";
  html += "<a href='/'>Home</a>";
  html += "<a href='/update'>Update Firmware</a>";
  html += "<a href='/config'>Configuration</a>";
  html += "<a href='/reboot'>Reboot</a>";
  html += "<a href='/status'>Status</a>";
  html += "</nav>";
  
  html += "<h2>Upload New Firmware</h2>";
  html += "<form method='POST' action='/update' enctype='multipart/form-data'>";
  html += "<p>Current firmware will be replaced with the uploaded file.</p>";
  html += "<input type='file' name='update' accept='.bin'>";
  html += "<input type='submit' value='Update'>";
  html += "</form>";
  
  html += "</div></body></html>";
  
  webServer.send(200, "text/html", html);
}

void handle_update_result() {
  bool success = (Update.hasError() == false);
  String html = "<html><head><meta http-equiv='refresh' content='5;URL=/'></head><body>";
  
  if (success) {
    html += "<h1>Update Successful</h1><p>Device will reboot now...</p>";
  } else {
    html += "<h1>Update Failed</h1><p>Redirecting back to home page in 5 seconds...</p>";
  }
  
  html += "</body></html>";
  webServer.send(200, "text/html", html);
  
  if (success) {
    delay(1000);
    ESP.restart();
  }
}

void handle_update_file_upload() {
  HTTPUpload& upload = webServer.upload();
  
  if (upload.status == UPLOAD_FILE_START) {
    Serial.printf("[WEBSERVER] Update: %s\n", upload.filename.c_str());
    
    // Start with max available size
    if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
      Update.printError(Serial);
    }
  } else if (upload.status == UPLOAD_FILE_WRITE) {
    // Write received data to flash
    if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
      Update.printError(Serial);
    }
  } else if (upload.status == UPLOAD_FILE_END) {
    // End the update
    if (Update.end(true)) {
      Serial.printf("[WEBSERVER] Update Success: %u bytes\n", upload.totalSize);
    } else {
      Update.printError(Serial);
    }
  }
}

void handle_reboot_form() {
  String html = "<html><head><title>Reboot Device</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }";
  html += "h1 { color: #0066cc; }";
  html += "nav { background: #f8f8f8; padding: 10px; margin-bottom: 20px; }";
  html += "nav a { margin-right: 15px; color: #0066cc; text-decoration: none; }";
  html += "nav a:hover { text-decoration: underline; }";
  html += ".container { max-width: 800px; margin: 0 auto; }";
  html += "form { background: #f8f8f8; padding: 15px; border-radius: 5px; }";
  html += "input[type=submit] { background: #cc0000; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }";
  html += "</style>";
  html += "</head><body>";
  html += "<div class='container'>";
  html += "<h1>Reboot Device</h1>";
  
  html += "<nav>";
  html += "<a href='/'>Home</a>";
  html += "<a href='/update'>Update Firmware</a>";
  html += "<a href='/config'>Configuration</a>";
  html += "<a href='/reboot'>Reboot</a>";
  html += "<a href='/status'>Status</a>";
  html += "</nav>";
  
  html += "<h2>Reboot</h2>";
  html += "<form method='POST' action='/reboot'>";
  html += "<p>Are you sure you want to reboot the device?</p>";
  html += "<input type='submit' value='Reboot Now'>";
  html += "</form>";
  
  html += "</div></body></html>";
  
  webServer.send(200, "text/html", html);
}

void handle_reboot() {
  String html = "<html><head><meta http-equiv='refresh' content='5;URL=/'></head><body>";
  html += "<h1>Rebooting Device</h1><p>Please wait...</p>";
  html += "</body></html>";
  
  webServer.send(200, "text/html", html);
  delay(1000);
  ESP.restart();
}

void handle_config_form() {
  String html = "<html><head><title>Configuration</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }";
  html += "h1 { color: #0066cc; }";
  html += "nav { background: #f8f8f8; padding: 10px; margin-bottom: 20px; }";
  html += "nav a { margin-right: 15px; color: #0066cc; text-decoration: none; }";
  html += "nav a:hover { text-decoration: underline; }";
  html += ".container { max-width: 800px; margin: 0 auto; }";
  html += "form { background: #f8f8f8; padding: 15px; border-radius: 5px; }";
  html += "label { display: block; margin: 10px 0 5px; }";
  html += "input[type=text] { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }";
  html += "input[type=submit] { background: #0066cc; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; margin-top: 10px; }";
  html += "</style>";
  html += "</head><body>";
  html += "<div class='container'>";
  html += "<h1>Device Configuration</h1>";
  
  html += "<nav>";
  html += "<a href='/'>Home</a>";
  html += "<a href='/update'>Update Firmware</a>";
  html += "<a href='/config'>Configuration</a>";
  html += "<a href='/reboot'>Reboot</a>";
  html += "<a href='/status'>Status</a>";
  html += "</nav>";
  
  html += "<h2>Device Settings</h2>";
  html += "<form method='POST' action='/config'>";
  
  html += "<label for='deviceId'>Device ID:</label>";
  html += "<input type='text' id='deviceId' name='deviceId' value='" + deviceId + "'>";
  
  html += "<label for='location'>Location:</label>";
  html += "<input type='text' id='location' name='location' value='" + deviceLocation + "'>";
  
  html += "<input type='submit' value='Save Configuration'>";
  html += "</form>";
  
  html += "</div></body></html>";
  
  webServer.send(200, "text/html", html);
}

void handle_config_save() {
  if (webServer.hasArg("deviceId")) {
    deviceId = webServer.arg("deviceId");
  }
  
  if (webServer.hasArg("location")) {
    deviceLocation = webServer.arg("location");
  }
  
  // Note: In a real implementation, you would save these values to EEPROM or SPIFFS
  // For this example, they're just stored in RAM and will be lost on reboot
  
  String html = "<html><head><meta http-equiv='refresh' content='3;URL=/config'></head><body>";
  html += "<h1>Configuration Saved</h1>";
  html += "<p>New settings:</p>";
  html += "<p>Device ID: " + deviceId + "</p>";
  html += "<p>Location: " + deviceLocation + "</p>";
  html += "<p>Redirecting back to configuration page...</p>";
  html += "</body></html>";
  
  webServer.send(200, "text/html", html);
}

void handle_status() {
  // Create a JSON status response
  String json = "{";
  json += "\"deviceId\":\"" + deviceId + "\",";
  json += "\"location\":\"" + deviceLocation + "\",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"mac\":\"" + WiFi.macAddress() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"uptime\":\"" + format_uptime(millis()) + "\",";
  json += "\"freeHeap\":" + String(ESP.getFreeHeap()) + ",";
  json += "\"rfidStatus\":\"" + String(mfrc522.PCD_PerformSelfTest() ? "OK" : "ERROR") + "\"";
  json += "}";
  
  webServer.send(200, "application/json", json);
  
  // Reinit RFID after self-test
  mfrc522.PCD_Init();
}

String format_uptime(unsigned long ms) {
  unsigned long seconds = ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  unsigned long days = hours / 24;
  
  seconds %= 60;
  minutes %= 60;
  hours %= 24;
  
  String uptime = "";
  if (days > 0) uptime += String(days) + " days, ";
  uptime += String(hours) + "h " + String(minutes) + "m " + String(seconds) + "s";
  
  return uptime;
}
