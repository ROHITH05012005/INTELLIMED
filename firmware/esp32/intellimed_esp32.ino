/*
 * =========================================================================
 * INTELLIMED — Smart Medicine Reminder System Firmware
 * Hardware:
 *   - ESP32 Development Board (30/38 pin)
 *   - 0.96" I2C OLED Display (SSD1306 128x64)
 *   - Active Buzzer
 *   - LED Light
 *   - Push Button
 *   - Breadboard & Jumper Wires
 * 
 * Backend: Firebase Cloud Firestore
 * =========================================================================
 * 
 * Required Libraries (Install via Arduino Library Manager):
 * 1. Adafruit SSD1306 (by Adafruit)
 * 2. Adafruit GFX Library (by Adafruit)
 * 3. ArduinoJson (by Benoit Blanchon)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <time.h>

// ─── 1. Wi-Fi Configuration ───────────────────────────────────────
const char* WIFI_SSID = "YOUR_WIFI_SSID";         // Replace with your WiFi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Replace with your WiFi Password

// ─── 2. Firebase Configuration ────────────────────────────────────
const char* FIREBASE_API_KEY = "AIzaSyDQX9ey2D5jwSbztT6C2iit7lrnvc3Up8o";
const String FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/intellimed-app/databases/(default)/documents/reminders?key=AIzaSyDQX9ey2D5jwSbztT6C2iit7lrnvc3Up8o";

// ─── 3. Hardware Pinout ───────────────────────────────────────────
#define BUZZER_PIN     19  // Buzzer Positive (+) pin
#define LED_PIN         2  // LED Anode (or built-in LED)
#define BUTTON_PIN      4  // Push Button (Internal pull-up to GND)

// OLED Display (I2C)
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT  64
#define OLED_RESET     -1
#define OLED_SDA       21  // ESP32 I2C SDA
#define OLED_SCL       22  // ESP32 I2C SCL
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ─── 4. NTP Clock (India Standard Time UTC +5:30) ─────────────────
const char* NTP_SERVER = "pool.ntp.org";
const long  GMT_OFFSET_SEC = 19800; // 5.5 hours = 19800 seconds
const int   DAYLIGHT_OFFSET_SEC = 0;

// Internal state
unsigned long lastFetchTime = 0;
const unsigned long FETCH_INTERVAL = 20000; // Check Firebase every 20 seconds
String lastTriggeredTime = "";
bool isAlarmActive = false;
String activeMedicineName = "";
String activeMedicineDocId = "";

struct MedicineReminder {
  String id;
  String name;
  String time; // "HH:MM"
  String dosage;
  bool enabled;
  bool takenToday;
};

#define MAX_REMINDERS 10
MedicineReminder remindersList[MAX_REMINDERS];
int reminderCount = 0;

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // Initialize I2C OLED Display
  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { // Address 0x3C or 0x3D
    Serial.println(F("[OLED] SSD1306 allocation failed. Check wiring!"));
  } else {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(18, 15);
    display.println("INTELLIMED");
    display.setCursor(12, 35);
    display.println("Starting Device...");
    display.display();
  }

  // Connect to Wi-Fi
  connectWiFi();

  // Setup Time
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);

  // First fetch from Firebase
  fetchRemindersFromFirebase();
  showHomeScreen();
}

void loop() {
  // Check Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Fetch reminders periodically
  if (millis() - lastFetchTime > FETCH_INTERVAL && !isAlarmActive) {
    lastFetchTime = millis();
    fetchRemindersFromFirebase();
    showHomeScreen();
  }

  // Check alarm condition
  checkClockAndReminders();

  // Handle active alarm beeping / blinking
  if (isAlarmActive) {
    handleAlarmBeep();
  }

  // Check physical button press
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println(F("[BUTTON] Button pressed!"));
      if (isAlarmActive) {
        dismissAlarmAndMarkTaken();
      }
      delay(300);
    }
  }

  delay(200);
}

// ─── Wi-Fi Connection ─────────────────────────────────────────────
void connectWiFi() {
  display.clearDisplay();
  display.setCursor(0, 10);
  display.println("Connecting WiFi:");
  display.println(WIFI_SSID);
  display.display();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n[WiFi] Connection Failed!");
  }
}

// ─── Fetch from Firebase Cloud Firestore ──────────────────────────
void fetchRemindersFromFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;

  if (https.begin(client, FIRESTORE_URL)) {
    int httpCode = https.GET();
    if (httpCode == HTTP_CODE_OK) {
      String payload = https.getString();
      parseReminders(payload);
    }
    https.end();
  }
}

void parseReminders(String jsonStr) {
  StaticJsonDocument<4096> doc;
  DeserializationError err = deserializeJson(doc, jsonStr);
  if (err) return;

  JsonArray documents = doc["documents"].as<JsonArray>();
  reminderCount = 0;

  for (JsonObject item : documents) {
    if (reminderCount >= MAX_REMINDERS) break;

    JsonObject fields = item["fields"];
    String name = fields["medicineName"]["stringValue"] | "";
    String timeStr = fields["time"]["stringValue"] | "";
    String dosage = fields["dosage"]["stringValue"] | "1 Dose";
    bool enabled = fields["enabled"]["booleanValue"] | true;
    bool takenToday = fields["takenToday"]["booleanValue"] | false;

    String docPath = item["name"].as<String>();
    String id = docPath.substring(docPath.lastIndexOf('/') + 1);

    if (name.length() > 0 && timeStr.length() > 0) {
      remindersList[reminderCount] = { id, name, timeStr, dosage, enabled, takenToday };
      reminderCount++;
    }
  }
}

// ─── Check Clock Against Scheduled Medicines ──────────────────────
void checkClockAndReminders() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return;

  char currentTime[6];
  strftime(currentTime, sizeof(currentTime), "%H:%M", &timeinfo);
  String currentStr = String(currentTime);

  if (lastTriggeredTime == currentStr) return;

  for (int i = 0; i < reminderCount; i++) {
    if (remindersList[i].enabled && !remindersList[i].takenToday) {
      if (remindersList[i].time == currentStr) {
        lastTriggeredTime = currentStr;
        startAlarm(remindersList[i]);
        break;
      }
    }
  }
}

// ─── Start Alarm Routine ──────────────────────────────────────────
void startAlarm(MedicineReminder reminder) {
  isAlarmActive = true;
  activeMedicineName = reminder.name;
  activeMedicineDocId = reminder.id;

  Serial.println("\n>>> ALARM TRIGGERED FOR: " + reminder.name);

  // Update OLED display with medicine alert
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(20, 2);
  display.println("! TIME TO TAKE !");
  display.drawLine(0, 12, 128, 12, SSD1306_WHITE);

  display.setTextSize(2);
  display.setCursor(0, 18);
  display.println(reminder.name);

  display.setTextSize(1);
  display.setCursor(0, 40);
  display.println(reminder.dosage);

  display.setCursor(0, 54);
  display.println("Press button to stop");
  display.display();
}

// ─── Beep and Blink ───────────────────────────────────────────────
void handleAlarmBeep() {
  digitalWrite(BUZZER_PIN, HIGH);
  digitalWrite(LED_PIN, HIGH);
  delay(150);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  delay(150);
}

// ─── Dismiss Alarm & Update Firebase ──────────────────────────────
void dismissAlarmAndMarkTaken() {
  isAlarmActive = false;
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);

  // Show confirmation on OLED
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(14, 15);
  display.println("TAKEN! OK");
  display.setTextSize(1);
  display.setCursor(8, 42);
  display.println("Recorded in Firebase");
  display.display();

  // Send update to Firebase
  updateFirebaseTaken(activeMedicineDocId);

  delay(2000);
  showHomeScreen();
}

// ─── Update Firestore Record ──────────────────────────────────────
void updateFirebaseTaken(String docId) {
  if (WiFi.status() != WL_CONNECTED || docId == "") return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;

  String url = "https://firestore.googleapis.com/v1/projects/intellimed-app/databases/(default)/documents/reminders/" + docId + "?updateMask.fieldPaths=takenToday&key=" + FIREBASE_API_KEY;

  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");
    String body = "{\"fields\":{\"takenToday\":{\"booleanValue\":true}}}";
    int code = https.sendRequest("PATCH", body);
    Serial.printf("[Firestore] Status updated: %d\n", code);
    https.end();
  }
}

// ─── Normal Home Screen on OLED ───────────────────────────────────
void showHomeScreen() {
  struct tm timeinfo;
  char timeBuffer[10] = "--:--";
  if (getLocalTime(&timeinfo)) {
    strftime(timeBuffer, sizeof(timeBuffer), "%I:%M %p", &timeinfo);
  }

  // Find next pending medicine
  String nextMed = "None scheduled";
  String nextTime = "";
  for (int i = 0; i < reminderCount; i++) {
    if (remindersList[i].enabled && !remindersList[i].takenToday) {
      nextMed = remindersList[i].name;
      nextTime = remindersList[i].time;
      break;
    }
  }

  display.clearDisplay();
  // Header
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("INTELLIMED");
  display.setCursor(80, 0);
  display.println(WiFi.status() == WL_CONNECTED ? "WiFi:OK" : "No WiFi");
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  // Time
  display.setTextSize(2);
  display.setCursor(18, 16);
  display.println(timeBuffer);

  // Next Medicine
  display.drawLine(0, 36, 128, 36, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 42);
  display.print("Next: ");
  display.println(nextMed);
  display.setCursor(0, 54);
  display.print("Time: ");
  display.println(nextTime != "" ? nextTime : "Done for today!");

  display.display();
}
