// Buzzer functionality

void buzzer_setup() {
  Serial.println(F("[Buzzer] Initializing"));
  
  // Set buzzer pin mode
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize buzzer to off
  digitalWrite(BUZZER_PIN, LOW);
}

void buzzer_beep(int frequency, int duration) {
  tone(BUZZER_PIN, frequency, duration);
}

void buzzer_play_startup() {
  // Play startup melody
  buzzer_beep(2000, 100);
  delay(100);
  buzzer_beep(2500, 100);
  delay(100);
  buzzer_beep(3000, 150);
}

void buzzer_play_read() {
  // Short beep for card read
  buzzer_beep(2000, 100);
}

void buzzer_play_success() {
  // Success sound (two ascending tones)
  buzzer_beep(2000, 100);
  delay(100);
  buzzer_beep(2500, 150);
}

void buzzer_play_error() {
  // Error sound (two descending tones)
  buzzer_beep(2000, 100);
  delay(100);
  buzzer_beep(1500, 150);
}

void buzzer_play_notification() {
  // Notification sound (three quick beeps)
  buzzer_beep(2000, 80);
  delay(100);
  buzzer_beep(2000, 80);
  delay(100);
  buzzer_beep(2000, 80);
}
