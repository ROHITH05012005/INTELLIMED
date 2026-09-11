-- ==========================================================
-- INTELLIMED Database Schema
-- Compatible with PostgreSQL, MySQL, and SQLite
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(32),
    sound_alerts BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    time_zone VARCHAR(64) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Medicine Reminders Table (Core Frontend Table)
CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(128) NOT NULL DEFAULT '1 Dose',
    time VARCHAR(8) NOT NULL, -- Format: "HH:MM" e.g. "08:00", "14:30"
    compartment_slot INT DEFAULT 1, -- Physical slot on ESP32 dispenser (1, 2, 3...)
    enabled BOOLEAN DEFAULT TRUE,
    taken_today BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Dispense & Adherence Logs Table (Physical & Web Trigger Log)
CREATE TABLE IF NOT EXISTS dispense_logs (
    id VARCHAR(64) PRIMARY KEY,
    reminder_id VARCHAR(64) REFERENCES reminders(id) ON DELETE SET NULL,
    medicine_name VARCHAR(255) NOT NULL,
    compartment_slot INT NOT NULL,
    action VARCHAR(32) NOT NULL, -- 'dispensed', 'taken', 'missed', 'skipped'
    trigger_source VARCHAR(32) DEFAULT 'web_app', -- 'web_app', 'hardware_button', 'auto_timer'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. IoT Dispenser Device Telemetry Table (ESP32 Status)
CREATE TABLE IF NOT EXISTS device_telemetry (
    device_id VARCHAR(64) PRIMARY KEY,
    model VARCHAR(128) DEFAULT 'ESP32-WROOM-32',
    status VARCHAR(32) DEFAULT 'online', -- 'online', 'offline', 'dispensing'
    battery_percent INT DEFAULT 100,
    wifi_signal VARCHAR(64) DEFAULT 'Strong',
    pills_remaining INT DEFAULT 0,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data Seeding
INSERT INTO users (id, name, email) 
VALUES ('user_primary', 'Primary Patient', 'patient@intellimed.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reminders (id, user_id, medicine_name, dosage, time, compartment_slot, enabled, taken_today)
VALUES 
    ('med_01', 'user_primary', 'Paracetamol', '650mg • 1 Tablet', '08:00', 1, TRUE, TRUE),
    ('med_02', 'user_primary', 'Amoxicillin', '500mg • 1 Capsule', '14:00', 2, TRUE, FALSE),
    ('med_03', 'user_primary', 'Vitamin D3', '60000 IU • 1 Tablet', '20:30', 3, TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO device_telemetry (device_id, model, status, battery_percent, wifi_signal, pills_remaining)
VALUES ('ESP32-MED-01', 'ESP32-WROOM-32', 'online', 94, 'Strong (-54 dBm)', 18)
ON CONFLICT (device_id) DO NOTHING;
