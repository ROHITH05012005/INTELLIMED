import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDQX9ey2D5jwSbztT6C2iit7lrnvc3Up8o',
  authDomain: 'intellimed-app.firebaseapp.com',
  projectId: 'intellimed-app',
  storageBucket: 'intellimed-app.firebasestorage.app',
  messagingSenderId: '798516254633',
  appId: '1:798516254633:web:5260de45d4e9de364e16b8',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTables() {
  console.log('Creating Firebase tables/collections for INTELLIMED...');

  try {
    // 1. Reminders Table
    console.log('-> Creating `reminders` table...');
    const reminders = [
      {
        id: 'med_01',
        medicineName: 'Paracetamol',
        time: '08:00',
        dosage: '650mg • 1 Tablet',
        compartment: 1,
        enabled: true,
        takenToday: true,
        createdAt: serverTimestamp(),
      },
      {
        id: 'med_02',
        medicineName: 'Amoxicillin',
        time: '14:00',
        dosage: '500mg • 1 Capsule',
        compartment: 2,
        enabled: true,
        takenToday: false,
        createdAt: serverTimestamp(),
      },
      {
        id: 'med_03',
        medicineName: 'Vitamin D3',
        time: '20:30',
        dosage: '60000 IU • 1 Tablet',
        compartment: 3,
        enabled: true,
        takenToday: false,
        createdAt: serverTimestamp(),
      },
    ];

    for (const item of reminders) {
      const { id, ...data } = item;
      await setDoc(doc(db, 'reminders', id), data);
    }

    // 2. Dispense Logs Table
    console.log('-> Creating `dispense_logs` table...');
    await setDoc(doc(db, 'dispense_logs', 'log_01'), {
      medicineName: 'Paracetamol',
      compartment: 1,
      action: 'dispensed',
      status: 'taken',
      triggerSource: 'web_app',
      timestamp: serverTimestamp(),
    });

    // 3. IoT Device Telemetry Table
    console.log('-> Creating `device_telemetry` table...');
    await setDoc(doc(db, 'device_telemetry', 'esp32_dispenser_01'), {
      deviceId: 'ESP32-MED-01',
      model: 'ESP32-WROOM-32',
      status: 'online',
      batteryPercent: 94,
      wifiSignal: 'Strong (-54 dBm)',
      pillsRemaining: 18,
      lastSync: serverTimestamp(),
    });

    // 4. User Profile Table
    console.log('-> Creating `user_profile` table...');
    await setDoc(doc(db, 'user_profile', 'user_primary'), {
      name: 'Primary Patient',
      soundAlerts: true,
      pushNotifications: true,
      timeZone: 'Asia/Kolkata',
      createdAt: serverTimestamp(),
    });

    console.log('✓ All 4 Firebase tables/collections created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating Firebase tables:', err);
    process.exit(1);
  }
}

createTables();
