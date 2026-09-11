/*
 * =========================================================================
 * INTELLIMED — Smart Medicine Dispenser & Reminder Firmware
 * Hardware: ESP32 (ESP32-WROOM-32)
 * Backend: Firebase Cloud Firestore
 * =========================================================================
 * 
 * Required Libraries (Install via Arduino Library Manager):
 * 1. ArduinoJson (by Benoit Blanchon)
 * 2. ESP32Servo (by Kevin Harrington)
 * 3. Adafruit SSD1306 & Adafruit GFX (Optional for OLED Display)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <time.h>

// ─── 1. Wi-Fi Credentials ─────────────────────────────────────────
const char* WIFI_SSID = "YOUR_WIFI_SSID";         // Replace with your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Replace with your WiFi password

// ─── 2. Firebase Configuration ────────────────────────────────────
const char* FIREBASE_PROJECT_ID = "intellimed-app";
const char* FIREBASE_API_KEY = "AIzaSyDQX9ey2D5jwSbztT6C2iit7lrnvc3Up8o";

// Firestore REST Endpoint
const String FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/intellimed-app/databases/(default)/documents/reminders?key=AIzaSyDQX9ey2D5jwSbztT6C2iit7lrnvc3Up8o";

// ─── 3. Hardware Pinout ───────────────────────────────────────────
#define SERVO_PIN      18  // Servo motor for dispensing pills
#define BUZZER_PIN     19  // Piezo buzzer for audio alarm
#define LED_PIN         2  // Status / Alert LED (Built-in or external)
#define BUTTON_PIN      4  // Physical "Taken / Dispense" button (Pull-up)

Servo dispenserServo;

// ─── 4. NTP Time Configuration (India Standard Time UTC +5:30) ────
const char* NTP_SERVER = "pool.ntp.org";
const long  GMT_OFFSET_SEC = 19800; // +5 hours 30 mins (5.5 * 3600)
const int   DAYLIGHT_OFFSET_SEC = 0;

// Internal state
unsigned long lastFetchTime = 0;
const unsigned long FETCH_INTERVAL = 30000; // Fetch from Firebase every 30 seconds
String lastTriggeredTime = "";

struct MedicineReminder {
  String id;
  String name;
  String time;      // "HH:MM"
  int compartment;  // 1, 2, 3
  bool enabled;
  bool takenToday;
};

#define MAX_REMINDERS 10
MedicineReminder activeReminders[MAX_REMINDERS];
int reminderCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- INTELLIMED SMART DISPENSER INITIALIZING ---");

  // Setup GPIO pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // Setup Servo
  ESP32PWM::allocateTimer(0);
  dispenserServo.setPeriodHertz(50);
  dispenserServo.attach(SERVO_PIN, 500, 2400);
  dispenserServo.write(0); // Home position

  // Connect to Wi-Fi
  connectWiFi();

  // Configure NTP Time
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  Serial.println("[NTP] Synchronizing current time...");
  printCurrentTime();

  // Initial fetch from Firebase
  fetchRemindersFromFirebase();
}

void loop() {
  // 1. Maintain Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 2. Periodic sync from Firebase Firestore
  if (millis() - lastFetchTime > FETCH_INTERVAL) {
    lastFetchTime = millis();
    fetchRemindersFromFirebase();
  }

  // 3. Check clock against scheduled reminders
  checkScheduledReminders();

  // 4. Check physical hardware button
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("[BUTTON] Hardware 'Taken' button pressed!");
      stopAlarm();
      delay(500);
    }
  }

  delay(1000);
}

// ─── Wi-Fi Connection Helper ──────────────────────────────────────
void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n[WiFi] Connection failed! Will retry...");
  }
}

// ─── Fetch from Cloud Firestore REST API ──────────────────────────
void fetchRemindersFromFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Skip SSL certificate validation on ESP32

  HTTPClient https;
  Serial.println("[Firestore] Fetching active reminders...");

  if (https.begin(client, FIRESTORE_URL)) {
    int httpCode = https.GET();

    if (httpCode == HTTP_CODE_OK) {
      String payload = https.getString();
      parseFirestorePayload(payload);
    } else {
      Serial.printf("[Firestore] Error GET request failed: %d\n", httpCode);
    }
    https.end();
  }
}

// ─── Parse JSON Documents from Firestore ──────────────────────────
void parseFirestorePayload(String jsonStr) {
  StaticJsonDocument<4096> doc;
  DeserializationError error = deserializeJson(doc, jsonStr);

  if (error) {
    Serial.print("[JSON] Deserialization failed: ");
    Serial.println(error.f_str());
    return;
  }

  JsonArray documents = doc["documents"].as<JsonArray>();
  reminderCount = 0;

  for (JsonObject item : documents) {
    if (reminderCount >= MAX_REMINDERS) break;

    JsonObject fields = item["fields"];
    String name = fields["medicineName"]["stringValue"] | "";
    String timeStr = fields["time"]["stringValue"] | "";
    bool enabled = fields["enabled"]["booleanValue"] | true;
    bool takenToday = fields["takenToday"]["booleanValue"] | false;
    int compartment = fields["compartment"]["integerValue"] | 1;

    // Document ID path: projects/.../databases/.../documents/reminders/{id}
    String docPath = item["name"].as<String>();
    String id = docPath.substring(docPath.lastIndexOf('/') + 1);

    if (name.length() > 0 && timeStr.length() > 0) {
      activeReminders[reminderCount].id = id;
      activeReminders[reminderCount].name = name;
      activeReminders[reminderCount].time = timeStr;
      activeReminders[reminderCount].compartment = compartment;
      activeReminders[reminderCount].enabled = enabled;
      activeReminders[reminderCount].takenToday = takenToday;

      Serial.printf("  -> Loaded: %s at %s (Slot #%d, Enabled: %d, Taken: %d)\n",
                    name.c_str(), timeStr.c_str(), compartment, enabled, takenToday);
      reminderCount++;
    }
  }
}

// ─── Check Alarm Time ─────────────────────────────────────────────
void checkScheduledReminders() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return;

  char currentTime[6];
  strftime(currentTime, sizeof(currentTime), "%H:%M", &timeinfo);
  String currentStr = String(currentTime);

  if (lastTriggeredTime == currentStr) return; // Already triggered for this minute

  for (int i = 0; i < reminderCount; i++) {
    if (activeReminders[i].enabled && !activeReminders[i].takenToday) {
      if (activeReminders[i].time == currentStr) {
        lastTriggeredTime = currentStr;
        triggerDispenseRoutine(activeReminders[i]);
        break;
      }
    }
  }
}

// ─── Trigger Hardware Routine (Buzzer, Servo, LED) ────────────────
void triggerDispenseRoutine(MedicineReminder reminder) {
  Serial.println("\n***************************************************");
  Serial.printf("⏰ ALARM TRIGGERED FOR: %s (Slot #%d)\n", reminder.name.c_str(), reminder.compartment);
  Serial.println("***************************************************");

  // 1. Move servo motor to drop pill from compartment
  dispensePill(reminder.compartment);

  // 2. Sound Buzzer and Blink LED alarm for 15 seconds or until button press
  for (int i = 0; i < 30; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    digitalWrite(LED_PIN, HIGH);
    delay(250);
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
    delay(250);

    // Stop if user presses the physical button
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("[ALARM] Dismissed via physical button!");
      break;
    }
  }

  // 3. Mark as taken in Cloud Firestore
  updateReminderTakenInFirestore(reminder.id);
}

// ─── Physical Servo Dispensing Mechanism ──────────────────────────
void dispensePill(int slot) {
  Serial.printf("[SERVO] Rotating for Slot #%d...\n", slot);
  
  // Angle mapped to slot compartment
  int targetAngle = slot * 60; // Slot 1 = 60°, Slot 2 = 120°, Slot 3 = 180°
  dispenserServo.write(targetAngle);
  delay(1200); // Allow pill to drop
  dispenserServo.write(0); // Return to home/lock
  delay(500);
}

void stopAlarm() {
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);
}

// ─── Mark Reminder Taken in Firestore REST ────────────────────────
void updateReminderTakenInFirestore(String docId) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;

  String url = "https://firestore.googleapis.com/v1/projects/intellimed-app/databases/(default)/documents/reminders/" + docId + "?updateMask.fieldPaths=takenToday&key=" + FIREBASE_API_KEY;

  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");
    String requestBody = "{\"fields\":{\"takenToday\":{\"booleanValue\":true}}}";
    int httpCode = https.sendRequest("PATCH", requestBody);

    if (httpCode == HTTP_CODE_OK) {
      Serial.printf("[Firestore] Successfully marked %s as TAKEN in Firestore!\n", docId.c_str());
    } else {
      Serial.printf("[Firestore] Error updating status: %d\n", httpCode);
    }
    https.end();
  }
}

void printCurrentTime() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    Serial.println(&timeinfo, "[Time] Current Local Time: %A, %B %d %Y %H:%M:%S");
  }
}
