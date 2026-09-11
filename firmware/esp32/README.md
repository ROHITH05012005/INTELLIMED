# INTELLIMED — Hardware Wiring & Integration Guide

This guide is customized specifically for your exact hardware components:
- **ESP32 Dev Module**
- **0.96" I2C OLED Display (SSD1306 128x64)**
- **Active Buzzer**
- **LED Light**
- **Push Button**
- **Breadboard & Jumper Wires**

---

## 1. Breadboard Pinout Connection Table

| Component | Component Pin | Connect to ESP32 Pin | Note |
| :--- | :--- | :--- | :--- |
| **OLED Display** | **VCC** | **3.3V** or **VIN / 5V** | Power (matches OLED spec) |
| | **GND** | **GND** | Ground rail |
| | **SDA** | **GPIO 21** | I2C Data |
| | **SCL** | **GPIO 22** | I2C Clock |
| **Active Buzzer** | **(+) Positive Pin** | **GPIO 19** | Audio alarm trigger |
| | **(-) Negative Pin** | **GND** | Ground rail |
| **LED Light** | **Anode (Long leg)** | **GPIO 2** | Through 220Ω-330Ω resistor |
| | **Cathode (Short leg)**| **GND** | Ground rail |
| **Push Button** | **Pin 1 (Leg A)** | **GPIO 4** | "Taken / Dismiss" input |
| | **Pin 2 (Leg B)** | **GND** | Uses internal pull-up |

---

## 2. Arduino IDE Libraries Setup

Open **Arduino IDE** and install these 3 libraries from **Sketch → Include Library → Manage Libraries**:

1. **`Adafruit SSD1306`** (by Adafruit)
2. **`Adafruit GFX Library`** (by Adafruit)
3. **`ArduinoJson`** (by Benoit Blanchon)

---

## 3. Flash Code to ESP32

1. Open [`firmware/esp32/intellimed_esp32.ino`](./intellimed_esp32.ino).
2. Change your Wi-Fi name & password at lines 30–31:
   ```cpp
   const char* WIFI_SSID = "Your_WiFi_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   ```
3. Connect ESP32 via micro-USB / Type-C.
4. Select board **ESP32 Dev Module**, choose your Port, and click **Upload**.

---

## 4. Live Behavior

1. **On Boot:**
   - OLED shows `INTELLIMED Starting...` and connects to your Wi-Fi.
   - OLED displays current local time (e.g. `02:30 PM`) and the next scheduled medicine (e.g. `Next: Paracetamol`).
2. **When Reminder Time Arrives:**
   - 🔊 **Buzzer beeps** rapidly.
   - 🚨 **LED flashes**.
   - 📺 **OLED screen updates** in bold text:
     ```
     ! TIME TO TAKE !
     Paracetamol
     1 Tablet after breakfast
     Press button to stop
     ```
3. **When you press the button:**
   - Alarm stops immediately.
   - OLED shows: `TAKEN! OK - Recorded in Firebase`.
   - ESP32 updates Firebase Firestore in the cloud.
   - Your live website at **https://frontend-pi-one-45.vercel.app** instantly marks the medicine as **`Taken ✓`**!
