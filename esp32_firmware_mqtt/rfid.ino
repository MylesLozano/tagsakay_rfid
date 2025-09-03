// RFID functionality

void rfid_setup() {
  Serial.println(F("[RFID] Initializing"));
  
  // Initialize MFRC522
  mfrc522.PCD_Init();
  
  // Check if MFRC522 is responding
  if (rfid_self_test()) {
    Serial.println(F("[RFID] Self-test passed"));
    rfid_initialized = true;
  } else {
    Serial.println(F("[RFID] Self-test failed"));
    display_error("RFID Init Failed");
    rfid_initialized = false;
  }
  
  // Show firmware version
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print(F("[RFID] Firmware Version: 0x"));
  Serial.println(v, HEX);
  
  if (v == 0x00 || v == 0xFF) {
    Serial.println(F("[RFID] Warning: Communication failure, check connections"));
    display_error("RFID Comm Failure");
    rfid_initialized = false;
  }
  
  Serial.println(F("[RFID] Ready to scan cards"));
}

bool rfid_self_test() {
  // Test if we can read/write to the MFRC522 registers
  byte testValue = 0x55;
  
  // Write test value
  mfrc522.PCD_WriteRegister(mfrc522.CommandReg, testValue);
  
  // Read back value
  byte readValue = mfrc522.PCD_ReadRegister(mfrc522.CommandReg);
  
  // Clear register to prevent interference with normal operation
  mfrc522.PCD_WriteRegister(mfrc522.CommandReg, 0x00);
  
  // Return true if the test passed
  return (readValue == testValue);
}

// Helper functions for RFID card data conversion
void array_to_string(byte array[], unsigned int len, char buffer[]) {
  for (unsigned int i = 0; i < len; i++) {
    byte nib1 = (array[i] >> 4) & 0x0F;
    byte nib2 = (array[i] >> 0) & 0x0F;
    buffer[i * 2 + 0] = nib1 < 0xA ? '0' + nib1 : 'A' + nib1 - 0xA;
    buffer[i * 2 + 1] = nib2 < 0xA ? '0' + nib2 : 'A' + nib2 - 0xA;
  }
  buffer[len * 2] = '\0';
}

// Print card details to Serial for debugging
void print_card_details() {
  // Show some details of the PICC (that is: the tag/card)
  Serial.print(F("Card UID:"));
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.println();
  
  // Show the card type
  Serial.print(F("PICC type: "));
  MFRC522::PICC_Type piccType = mfrc522.PICC_GetType(mfrc522.uid.sak);
  Serial.println(mfrc522.PICC_GetTypeName(piccType));
}
