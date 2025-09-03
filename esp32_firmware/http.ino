// HTTP API calls to backend

void API_call(String card_UID) {
  // Create a JSON payload
  StaticJsonDocument<400> outbound_JSON_message;

  outbound_JSON_message["tagId"] = card_UID;
  outbound_JSON_message["deviceId"] = deviceId;
  outbound_JSON_message["location"] = deviceLocation;
  outbound_JSON_message["metadata"] = StaticJsonDocument<100>();
  outbound_JSON_message["metadata"]["firmware"] = "1.0.0";
  outbound_JSON_message["metadata"]["scanType"] = "regular";
  
  char JSONmessageBuffer[400];
  serializeJson(outbound_JSON_message, JSONmessageBuffer, sizeof(JSONmessageBuffer));
  
  Serial.print(F("[HTTP] Outbound payload: "));
  serializeJson(outbound_JSON_message, Serial);
  Serial.println();

  // Sending the payload using HTTP POST request
  HTTPClient http;
  http.begin(API_URL);
  http.setTimeout(5000); // 5 seconds timeout
  
  // Add headers
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY); // API_KEY should be defined in credentials.h
  
  // Send the request
  int httpCode = http.POST(JSONmessageBuffer);
  
  Serial.print(F("[HTTP] Response code: "));
  Serial.println(httpCode);
  
  if (httpCode > 0) {
    String payload = http.getString();
    Serial.print(F("[HTTP] Inbound payload: "));
    Serial.println(payload);
    
    // Parsing payload
    StaticJsonDocument<400> inbound_JSON_message;
    DeserializationError error = deserializeJson(inbound_JSON_message, payload);
    
    if (error) {
      Serial.print(F("[JSON] Deserialization error: "));
      Serial.println(error.c_str());
      display_error("JSON Error");
      buzzer_play_error();
      return;
    }
    
    if (httpCode == 200) {
      // Success
      bool success = inbound_JSON_message["success"];
      
      if (success) {
        String userName = "Unknown";
        String eventType = "unknown";
        
        // Extract user data if available
        if (inbound_JSON_message["data"].containsKey("user") && 
            !inbound_JSON_message["data"]["user"].isNull()) {
          userName = inbound_JSON_message["data"]["user"]["name"].as<String>();
        }
        
        // Extract event type if available
        if (inbound_JSON_message["data"].containsKey("eventType")) {
          eventType = inbound_JSON_message["data"]["eventType"].as<String>();
        }
        
        display_success(userName, eventType);
        buzzer_play_success();
      } else {
        // API returned success=false
        String message = inbound_JSON_message["message"];
        display_error(message);
        buzzer_play_error();
      }
    }
    else {
      // Response code was error
      String message = inbound_JSON_message.containsKey("message") ? 
                       inbound_JSON_message["message"].as<String>() : 
                       "HTTP Error " + String(httpCode);
      display_error(message);
      buzzer_play_error();
    }
  }
  else {
    // Response code was negative (unable to connect)
    display_error("Connection Failed");
    buzzer_play_error();       
  }

  // Close HTTP connection
  http.end();
}
