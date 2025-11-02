/*
 * TagSakay RFID Scanner - Production Ready Version
 * 
 * Modular architecture with comprehensive error handling,
 * state management, and automatic recovery
 */

#include "Config.h"
#include "DisplayModule.h"
#include "NetworkModule.h"
#include "RFIDModule.h"
#include "KeypadModule.h"
#include "UARTModule.h"
#include "ApiModule.h"

// Configuration instances (definitions)
WiFiConfig wifiConfig = {
  "SSID",
  "Password",
  10,
  5000
};

ServerConfig serverConfig = {
  "http://192.168.1.73:3000",
  "de271a_09e103534510b7bf7700d847994c8c6c3433e4214598912db1773a4108df1852",
  10000,
  "Entrance Gate"
};

NTPConfig ntpConfig = {
  "pool.ntp.org",
  8 * 3600,
  0
};

// Device configuration
DeviceConfig deviceConfig = {
  DEVICE_NAME,
  "Entrance Gate",  // Will be set based on serverConfig
  FIRMWARE_VERSION,
  false,  // registrationMode
  false,  // scanMode
  LED_BRIGHTNESS_DEFAULT,
  MIN_SCAN_INTERVAL
};

// System status tracking
SystemStatus systemStatus = {
  false,  // wifiConnected
  false,  // rfidInitialized
  false,  // apiConnected
  false,  // offlineMode
  0,      // uptime
  0,      // freeHeap
  0,      // scanCount
  0,      // errorCount
  0       // lastHeartbeat
};

// Global state variables (definitions)
String deviceId = "";
String lastScannedTag = "";
bool registrationMode = false;
String expectedRegistrationTagId = "";
unsigned long lastRegistrationCheck = 0;
unsigned long registrationModeStartTime = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastScanTime = 0;

// Module instances (using enhanced classes)
NetworkModule networkModule;
RFIDModule rfidModule;
KeypadModule keypadModule;
ApiModule apiModule;

// System state
bool systemReady = false;
bool offlineMode = false;

// Function declarations
bool initializeSystem();
void handleSystemError(const char* component, const char* error);
void handleRFIDScanning();
void handleKeypadInputNew();
void sendPeriodicHeartbeat();
void checkNetworkConnection();

void setup(void) {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n================================");
  Serial.println("  TagSakay RFID Scanner v2.0");
  Serial.println("================================\n");

  // Initialize system with comprehensive error handling
  if (!initializeSystem()) {
    Serial.println("\n[SYSTEM] FATAL: Initialization failed!");
    Serial.println("[SYSTEM] Entering safe mode - limited functionality");
    
    updateStatusSection("INIT FAILED", TFT_RED);
    updateFooter("System in safe mode");
    
    // Don't halt - allow manual recovery
    systemReady = false;
    offlineMode = true;
  } else {
    Serial.println("\n[SYSTEM] All modules initialized successfully");
    Serial.println("[SYSTEM] System ready for operation");
    Serial.println("[SYSTEM] Press 'A' on keypad for menu\n");
    
    systemReady = true;
    indicateReady();
    updateScanSection("", "", "", TFT_WHITE);
    sendToLEDMatrix("STATUS", "READY", "");
  }
}

bool initializeSystem() {
  bool allSuccess = true;
  
  LOG_INFO("System initialization started");
  
  // 1. Initialize Display (first for visual feedback)
  Serial.println("[1/6] Initializing Display...");
  initializeTFT();
  delay(500);

  // 2. Initialize UART
  Serial.println("[2/6] Initializing UART...");
  initializeUART();
  updateStatusSection("UART: OK", TFT_GREEN);
  delay(500);

  // 3. Initialize Keypad
  Serial.println("[3/6] Initializing Keypad...");
  if (!keypadModule.initialize()) {
    handleSystemError("KEYPAD", "Initialization failed");
    allSuccess = false;
  } else {
    updateStatusSection("Keypad: OK", TFT_GREEN);
  }
  delay(500);

  // 4. Initialize Network
  Serial.println("[4/6] Initializing Network...");
  updateStatusSection("Connecting WiFi...", TFT_YELLOW);
  
  WiFi.mode(WIFI_STA);
  deviceId = getDeviceMacAddress();
  Serial.print("[NETWORK] Device ID (MAC): ");
  Serial.println(deviceId);
  
  String deviceDisplay = deviceId.length() >= 4 ? deviceId.substring(deviceId.length() - 4) : deviceId;
  
  if (!networkModule.initialize(wifiConfig.ssid, wifiConfig.password)) {
    handleSystemError("NETWORK", "WiFi connection failed");
    updateConnectionStatus("Failed", "No sync", deviceDisplay);
    offlineMode = true;
    allSuccess = false;
    systemStatus.wifiConnected = false;
    systemStatus.offlineMode = true;
    Serial.println("[NETWORK] Continuing in OFFLINE mode");
  } else {
    updateStatusSection("WiFi: OK", TFT_GREEN);
    updateConnectionStatus("Connected", "Syncing...", deviceDisplay);
    Serial.print("[NETWORK] IP: ");
    Serial.println(networkModule.getIpAddress());
    systemStatus.wifiConnected = true;
  }
  delay(500);

  // 5. Initialize RFID
  Serial.println("[5/6] Initializing RFID...");
  updateStatusSection("Init RFID...", TFT_YELLOW);
  
  if (!rfidModule.initialize()) {
    handleSystemError("RFID", "PN532 not found");
    allSuccess = false;
    systemStatus.rfidInitialized = false;
  } else {
    updateStatusSection("RFID: OK", TFT_GREEN);
    Serial.println("[RFID] " + rfidModule.getFirmwareVersion());
    systemStatus.rfidInitialized = true;
  }
  delay(500);

  // 6. Initialize API Client
  Serial.println("[6/6] Initializing API...");
  updateStatusSection("Connecting API...", TFT_YELLOW);
  
  if (!apiModule.initialize(serverConfig.baseUrl, serverConfig.apiKey, deviceId)) {
    handleSystemError("API", "Initialization failed");
    offlineMode = true;
    allSuccess = false;
    systemStatus.apiConnected = false;
  } else {
    // Test API connection
    String response;
    if (offlineMode || !apiModule.checkConnection()) {
      Serial.println("[API] WARNING: Backend not reachable");
      updateStatusSection("API: OFFLINE", TFT_ORANGE);
      offlineMode = true;
      systemStatus.apiConnected = false;
      systemStatus.offlineMode = true;
    } else {
      updateStatusSection("API: OK", TFT_GREEN);
      systemStatus.apiConnected = true;
    }
  }
  
  // Initialize time synchronization (non-critical)
  if (!offlineMode) {
    updateStatusSection("Syncing time...", TFT_YELLOW);
    if (!initializeTime()) {
      Serial.println("[TIME] Sync failed - continuing");
      updateConnectionStatus("Connected", "No sync", deviceDisplay);
    } else {
      updateConnectionStatus("Connected", "Synced", deviceDisplay);
    }
  }
  
  delay(1000);
  
  // Update system status
  systemStatus.uptime = millis();
  systemStatus.freeHeap = ESP.getFreeHeap();
  
  LOG_INFO("System initialization completed");
  LOG_INFO("Free heap: " + String(systemStatus.freeHeap) + " bytes");
  
  // Return true even if some non-critical modules failed
  return rfidModule.isInitialized();  // RFID is critical
}

void handleSystemError(const char* component, const char* error) {
  Serial.print("[ERROR] ");
  Serial.print(component);
  Serial.print(": ");
  Serial.println(error);
  
  updateStatusSection(String(component) + " ERR", TFT_RED);
  updateFooter(String(error));
  sendToLEDMatrix("ERROR", String(component), "");
  
  delay(2000);
}

void loop(void) {
  if (!systemReady) {
    // Safe mode - minimal functionality
    handleKeypadInputNew();
    checkSerialCommands();
    delay(100);
    return;
  }

  // Check network connection and attempt reconnection
  checkNetworkConnection();
  
  // Handle RFID scanning
  handleRFIDScanning();

  // Handle keypad input (use both old and new methods for compatibility)
  handleKeypadInput();  // Legacy function
  handleKeypadInputNew();  // New class-based function
  
  // Check serial commands
  checkSerialCommands();

  unsigned long currentMillis = millis();
  
  // Check registration mode periodically (only if online)
  if (!offlineMode && currentMillis - lastRegistrationCheck > 5000) {
    lastRegistrationCheck = currentMillis;
    checkRegistrationModeFromServer();
  }
  
  // Send heartbeat
  sendPeriodicHeartbeat();
  
  // Handle keypad timeout
  if (checkKeypadTimeout(currentMillis)) {
    Serial.println("[KEYPAD] Input timeout");
    clearKeypadInput();
    indicateReady();
  }

  // Check registration timeout
  if (registrationMode && (currentMillis - registrationModeStartTime > REGISTRATION_MODE_TIMEOUT)) {
    Serial.println("[REGISTRATION] Timeout reached");
    registrationMode = false;
    expectedRegistrationTagId = "";
    
    if (!offlineMode) {
      reportDeviceStatus("registration_timeout");
    }
    
    blinkError(3);
    updateStatusSection("REG TIMEOUT", TFT_RED);
    updateFooter("Registration mode timed out");
  }

  delay(50);
}

void checkNetworkConnection() {
  networkModule.updateConnectionStatus();
  
  if (!networkModule.isConnected() && !offlineMode) {
    Serial.println("[NETWORK] Connection lost - attempting reconnect...");
    updateStatusSection("RECONNECTING", TFT_ORANGE);
    
    if (networkModule.reconnect()) {
      Serial.println("[NETWORK] Reconnected successfully");
      updateStatusSection("RECONNECTED", TFT_GREEN);
      offlineMode = false;
      apiModule.resetFailureCount();
      
      String deviceDisplay = deviceId.length() >= 4 ? deviceId.substring(deviceId.length() - 4) : deviceId;
      updateConnectionStatus("Connected", "Synced", deviceDisplay);
    } else {
      Serial.println("[NETWORK] Reconnection failed - entering offline mode");
      offlineMode = true;
      updateStatusSection("OFFLINE MODE", TFT_ORANGE);
    }
  }
}

void handleRFIDScanning() {
  if (!rfidModule.isInitialized()) {
    return;
  }
  
  String tagId;
  if (rfidModule.scanWithDebounce(tagId, RFID_DEBOUNCE_MS)) {
    // Validate tag ID
    if (!IS_VALID_TAG_ID(tagId)) {
      LOG_ERROR("Invalid tag ID: " + tagId);
      return;
    }
    
    systemStatus.scanCount++;
    
    LOG_INFO("RFID Scanned: " + tagId);
    Serial.print("[RFID] Total scans: ");
    Serial.println(systemStatus.scanCount);
    
    // Update display
    updateStatusSection("TAG DETECTED", TFT_CYAN);
    
    // Send to LED matrix
    sendToLEDMatrix("SCAN", tagId.substring(0, 8), "");
    
    if (registrationMode) {
      // Handle registration mode scanning
      handleRFIDLoop();  // Use legacy function for registration logic
    } else {
      // Normal scanning mode
      if (!offlineMode && apiModule.isInitialized()) {
        // Send to backend
        String response;
        if (apiModule.sendScan(tagId, response)) {
          Serial.println("[API] Scan sent successfully");
          handleScanResponse(response);  // Use legacy function to parse response
        } else {
          Serial.println("[API] Failed to send scan");
          updateStatusSection("SCAN FAILED", TFT_RED);
          updateScanSection(tagId, "OFFLINE", "Scan not sent", TFT_ORANGE);
          
          systemStatus.errorCount++;
          
          if (apiModule.getConsecutiveFailures() >= MAX_CONSECUTIVE_FAILURES) {
            LOG_ERROR("Multiple API failures - switching to offline mode");
            offlineMode = true;
            systemStatus.offlineMode = true;
            systemStatus.apiConnected = false;
            updateFooter("Too many failures - offline mode");
          }
        }
      } else {
        // Offline mode - just display
        Serial.println("[OFFLINE] Scan recorded locally");
        updateScanSection(tagId, "OFFLINE", "Backend unavailable", TFT_ORANGE);
        updateFooter("Offline scan: " + tagId.substring(0, 8));
      }
    }
    
    delay(200);
  }
}

void handleKeypadInputNew() {
  if (!keypadModule.isInitialized()) {
    return;
  }
  
  char key = keypadModule.getKey();
  
  if (key) {
    Serial.print("[KEYPAD] Key pressed: ");
    Serial.println(key);
    
    // Special system commands
    if (key == '#') {
      // Display system status
      Serial.println("\n[STATUS] System Information:");
      Serial.print("  WiFi: ");
      Serial.println(networkModule.isConnected() ? "Connected" : "Disconnected");
      Serial.print("  RFID: ");
      Serial.println(rfidModule.isInitialized() ? "OK" : "ERROR");
      Serial.print("  API Failures: ");
      Serial.println(apiModule.getConsecutiveFailures());
      Serial.print("  Mode: ");
      Serial.println(offlineMode ? "OFFLINE" : "ONLINE");
      Serial.print("  Uptime: ");
      Serial.print(millis() / 1000);
      Serial.println(" seconds");
      Serial.print("  Free Heap: ");
      Serial.print(ESP.getFreeHeap());
      Serial.println(" bytes");
      Serial.print("  Total Scans: ");
      Serial.println(systemStatus.scanCount);
      Serial.print("  Error Count: ");
      Serial.println(systemStatus.errorCount);
      Serial.println();
      
      updateStatusSection("STATUS CHECK", TFT_CYAN);
      updateFooter("Check serial monitor");
    } else if (key == '*') {
      // Force heartbeat
      String response;
      if (!offlineMode && apiModule.sendHeartbeat(response)) {
        Serial.println("[HEARTBEAT] Manual heartbeat sent");
        updateStatusSection("HEARTBEAT OK", TFT_GREEN);
      } else {
        Serial.println("[HEARTBEAT] Failed or offline");
        updateStatusSection("HEARTBEAT FAIL", TFT_RED);
      }
    }
  }
}

void sendPeriodicHeartbeat() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = currentMillis;
    
    if (!offlineMode && networkModule.isConnected()) {
      String response;
      if (apiModule.sendHeartbeat(response)) {
        Serial.println("[HEARTBEAT] Sent successfully");
        showHeartbeat(true);
        delay(100);
        showHeartbeat(false);
      } else {
        Serial.println("[HEARTBEAT] Failed");
        apiModule.incrementFailureCount();
      }
    } else {
      Serial.println("[HEARTBEAT] Skipped - offline mode");
    }
    
    // Update connection status display
    String wifiStatus = networkModule.isConnected() ? "Connected" : "Disconnected";
    String deviceDisplay = deviceId.length() >= 4 ? deviceId.substring(deviceId.length() - 4) : deviceId;
    updateConnectionStatus(wifiStatus, "Synced", deviceDisplay);
  }
}

void checkSerialCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command.equalsIgnoreCase("registration")) {
      registrationMode = !registrationMode;
      Serial.print("Registration mode ");
      Serial.println(registrationMode ? "ENABLED" : "DISABLED");

      if (registrationMode) {
        indicateRegistrationMode();
      }
    }
  }
}