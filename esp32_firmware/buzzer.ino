// Buzzer functionality

void buzzer_setup() {
  Serial.println(F("[BUZZER] Initializing"));
  
  // Configure buzzer PWM
  ledcSetup(BUZZER_CHANNEL, 2000, BUZZER_RESOLUTION);
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
  
  // Play startup sound
  buzzer_play_startup();
}

void buzzer_play_startup() {
  // Play a short startup tune
  ledcWriteTone(BUZZER_CHANNEL, 1000);
  delay(100);
  ledcWriteTone(BUZZER_CHANNEL, 1500);
  delay(100);
  ledcWriteTone(BUZZER_CHANNEL, 2000);
  delay(100);
  ledcWrite(BUZZER_CHANNEL, 0);
}

void buzzer_play_success() {
  // Play a success sound
  ledcWriteTone(BUZZER_CHANNEL, 1500);
  delay(100);
  ledcWriteTone(BUZZER_CHANNEL, 2000);
  delay(100);
  ledcWrite(BUZZER_CHANNEL, 0);
}

void buzzer_play_error() {
  // Play an error sound
  ledcWriteTone(BUZZER_CHANNEL, 300);
  delay(200);
  ledcWrite(BUZZER_CHANNEL, 0);
  delay(100);
  ledcWriteTone(BUZZER_CHANNEL, 300);
  delay(200);
  ledcWrite(BUZZER_CHANNEL, 0);
}

void buzzer_play_request_pending() {
  // Play a simple beep when card is detected
  ledcWriteTone(BUZZER_CHANNEL, 1000);
  delay(50);
  ledcWrite(BUZZER_CHANNEL, 0);
}
