// MQTT functionality

void mqtt_setup() {
  Serial.println(F("[MQTT] Initializing"));
  
  // Set MQTT server and port
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  
  // Set callback function for incoming messages
  mqttClient.setCallback(mqtt_callback);
  
  // Set keep-alive interval
  mqttClient.setKeepAlive(MQTT_KEEPALIVE);
}

void mqtt_maintain_connection() {
  // Check if MQTT is connected, try to reconnect if not
  if (!mqttClient.connected()) {
    mqtt_connected = false;
    
    // Only attempt to reconnect every few seconds to avoid blocking the main loop
    long now = millis();
    if (now - last_mqtt_connection_attempt > MQTT_RECONNECT_DELAY) {
      last_mqtt_connection_attempt = now;
      mqtt_reconnect();
    }
  } else {
    mqtt_connected = true;
  }
}

void mqtt_reconnect() {
  Serial.println(F("[MQTT] Attempting connection..."));
  
  // Create a client ID based on device ID and a random number
  String clientId = deviceId + "_" + String(random(0xffff), HEX);
  
  // Attempt to connect
  if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println(F("[MQTT] Connected"));
    mqtt_connected = true;
    
    // Subscribe to response topic
    mqttClient.subscribe(MQTT_TOPIC_RESPONSE);
    
    // Send a hello message
    StaticJsonDocument<100> helloDoc;
    helloDoc["deviceId"] = deviceId;
    helloDoc["status"] = "online";
    helloDoc["location"] = deviceLocation;
    
    char helloBuffer[100];
    serializeJson(helloDoc, helloBuffer, sizeof(helloBuffer));
    
    mqttClient.publish(MQTT_TOPIC_STATUS, helloBuffer);
  } else {
    Serial.print(F("[MQTT] Connection failed, rc="));
    Serial.println(mqttClient.state());
  }
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  // Handle incoming MQTT messages
  Serial.print(F("[MQTT] Message arrived ["));
  Serial.print(topic);
  Serial.print(F("]: "));
  
  // Convert payload to string for easier handling
  char message[length + 1];
  for (unsigned int i = 0; i < length; i++) {
    message[i] = (char)payload[i];
    Serial.print((char)payload[i]);
  }
  message[length] = '\0';
  Serial.println();
  
  // Check if it's a response to our RFID scan
  if (String(topic) == MQTT_TOPIC_RESPONSE) {
    process_response(message);
  }
}

void mqtt_send_scan(String card_UID) {
  // Create a JSON payload for MQTT
  StaticJsonDocument<400> scanDoc;
  
  scanDoc["tagId"] = card_UID;
  scanDoc["deviceId"] = deviceId;
  scanDoc["location"] = deviceLocation;
  scanDoc["timestamp"] = millis();
  scanDoc["metadata"]["firmware"] = "1.0.0";
  scanDoc["metadata"]["scanType"] = "regular";
  
  char scanBuffer[400];
  serializeJson(scanDoc, scanBuffer, sizeof(scanBuffer));
  
  Serial.print(F("[MQTT] Sending scan: "));
  Serial.println(scanBuffer);
  
  // Publish the message
  bool published = mqttClient.publish(MQTT_TOPIC_SCAN, scanBuffer);
  
  if (published) {
    Serial.println(F("[MQTT] Scan published successfully"));
  } else {
    Serial.println(F("[MQTT] Failed to publish scan"));
    display_error("MQTT Publish Error");
    buzzer_play_error();
  }
}

void process_response(const char* message) {
  // Parse the JSON response
  StaticJsonDocument<400> responseDoc;
  DeserializationError error = deserializeJson(responseDoc, message);
  
  if (error) {
    Serial.print(F("[JSON] Deserialization error: "));
    Serial.println(error.c_str());
    display_error("JSON Error");
    buzzer_play_error();
    return;
  }
  
  // Check if response was successful
  bool success = responseDoc["success"];
  
  if (success) {
    String userName = "Unknown";
    String eventType = "unknown";
    
    // Extract user data if available
    if (responseDoc["data"].containsKey("user") && 
        !responseDoc["data"]["user"].isNull()) {
      userName = responseDoc["data"]["user"]["name"].as<String>();
    }
    
    // Extract event type if available
    if (responseDoc["data"].containsKey("eventType")) {
      eventType = responseDoc["data"]["eventType"].as<String>();
    }
    
    display_success(userName, eventType);
    buzzer_play_success();
  } else {
    // API returned success=false
    String message = responseDoc["message"];
    display_error(message);
    buzzer_play_error();
  }
}
