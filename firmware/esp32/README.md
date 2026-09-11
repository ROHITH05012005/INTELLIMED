# INTELLIMED — Hardware & ESP32 Integration Guide

This guide explains how to connect your physical ESP32 Smart Medicine Dispenser to the live INTELLIMED web application and Firebase Cloud Firestore.

---

## 1. Hardware Components Required

| Component | Description | Recommended Pin on ESP32 |
| :--- | :--- | :--- |
| **Microcontroller** | ESP32 Dev Module (ESP32-WROOM-32) | — |
| **Servo Motor** | SG90 or MG996R (rotates pill slot) | **GPIO 18** |
| **Buzzer** | Active Piezo Buzzer (5V / 3.3V) | **GPIO 19** |
| **Status LED** | Red/Blue LED + 220Ω resistor | **GPIO 2** (or Built-in LED) |
| **Push Button** | Momentary tactile switch ("Taken" button) | **GPIO 4** (to GND) |
| **Power Supply** | 5V 2A USB Adapter or 18650 Battery Shield | VIN & GND |

---

## 2. Wiring Connections

```
ESP32 Pin          Component Connection
─────────────────────────────────────────────
GPIO 18 (PWM) ───► Servo Motor Signal (Orange/Yellow wire)
GPIO 19       ───► Active Buzzer (+) Positive Pin
GPIO 2        ───► LED Anode (Long leg with 220Ω resistor)
GPIO 4        ───► Push Button Pin 1 (Pin 2 connects to GND)
5V / VIN      ───► Servo VCC (Red wire) & Buzzer VCC
GND           ───► Servo GND (Brown/Black), Buzzer (-), Button Pin 2, LED Cathode
```

---

## 3. Flashing Firmware via Arduino IDE

1. **Install Arduino IDE** (v2.0 or newer).
2. **Add ESP32 Board URL** in **File → Preferences → Additional boards manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools → Board → Boards Manager**, search for `esp32` by Espressif and click **Install**.
4. Go to **Tools → Manage Libraries**, search and install:
   - **`ArduinoJson`** (by Benoit Blanchon - version 6 or 7)
   - **`ESP32Servo`** (by Kevin Harrington)
5. Open the firmware file:
   [`firmware/esp32/intellimed_esp32.ino`](./intellimed_esp32.ino)
6. Update your Wi-Fi credentials in lines 19-20:
   ```cpp
   const char* WIFI_SSID = "Your_WiFi_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   ```
7. Select **Tools → Board → ESP32 Dev Module** and choose your COM Port.
8. Click **Upload** (Hold `BOOT` button on ESP32 if upload stays on "Connecting...").

---

## 4. How the Integration Works (Live Demonstration Flow)

1. **You set a medicine time on your phone/PC** using the live web app:
   👉 [https://frontend-pi-one-45.vercel.app](https://frontend-pi-one-45.vercel.app)
   *(e.g., Medicine: "Paracetamol", Time: "14:30", Slot: 1)*
2. The web app saves this directly into **Firebase Firestore**.
3. Your **ESP32** wakes up, connects to Wi-Fi, and fetches the schedule directly from Firestore.
4. When the internal real-time clock hits the scheduled minute:
   - 🔊 The **Buzzer sounds** and **LED blinks** to alert the patient.
   - ⚙️ The **Servo motor rotates** to dispense the pill from Compartment #1.
   - 🔘 Patient takes the pill and presses the **hardware button** on the box.
   - ☁️ The ESP32 sends an instant update to Firestore marking `takenToday = true`.
   - 📱 The web app automatically updates to show **"Taken ✓"** without refreshing!
