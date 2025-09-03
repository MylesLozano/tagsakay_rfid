// RFID functionality

void rfid_setup() {
  Serial.println(F("[RFID] Initializing MFRC522 reader"));
  SPI.begin(SPI_SCK_PIN, SPI_MISO_PIN, SPI_MOSI_PIN, RFID_SS_PIN);
  mfrc522.PCD_Init();
  Serial.print(F("[RFID] MFRC522 Reader version: "));
  mfrc522.PCD_DumpVersionToSerial();
  rfid_self_test();
}

void rfid_self_test() {
  if (mfrc522.PCD_PerformSelfTest()) {
    Serial.println(F("[RFID] Self-test OK"));
    // Need to reinit after self-test
    mfrc522.PCD_Init();
  }
  else {
    Serial.println(F("[RFID] Reader failure, rebooting..."));
    buzzer_play_error();
    delay(1000);
    ESP.restart();
  }
}

void rfid_periodic_self_test() {
  static long rfid_self_test_time = 0;
  if (millis() - rfid_self_test_time > RFID_SELF_TEST_PERIOD) {
    rfid_self_test_time = millis();
    rfid_self_test();
  }
}
