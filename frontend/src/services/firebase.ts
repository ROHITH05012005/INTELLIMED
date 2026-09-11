import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

export interface FirebaseReminder {
  id?: string;
  medicineName: string;
  time: string; // "HH:MM"
  dosage: string;
  enabled: boolean;
  takenToday: boolean;
  createdAt?: unknown;
}

const firebaseConfig = {
  apiKey: "AIzaSyDQX9ey2D5jwSbztT6C2iit7lrnvc3Up8o",
  authDomain: "intellimed-app.firebaseapp.com",
  projectId: "intellimed-app",
  storageBucket: "intellimed-app.firebasestorage.app",
  messagingSenderId: "798516254633",
  appId: "1:798516254633:web:5260de45d4e9de364e16b8"
};

// Initialize Firebase (singleton pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

const COLLECTION_NAME = 'reminders';

// Real-time listener for reminders
export function subscribeReminders(
  onData: (reminders: FirebaseReminder[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('time', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: FirebaseReminder[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<FirebaseReminder, 'id'>),
        }));
        onData(items);
      },
      (error) => {
        console.warn('Firestore subscription warning:', error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn('Could not subscribe to Firestore:', err);
    return () => {};
  }
}

// Add a new reminder
export async function addReminder(reminder: Omit<FirebaseReminder, 'id' | 'createdAt'>) {
  return await addDoc(collection(db, COLLECTION_NAME), {
    ...reminder,
    createdAt: serverTimestamp(),
  });
}

// Update reminder (e.g. toggle active or mark taken)
export async function updateReminder(id: string, updates: Partial<FirebaseReminder>) {
  const docRef = doc(db, COLLECTION_NAME, id);
  return await updateDoc(docRef, updates);
}

// Delete reminder
export async function deleteReminder(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id);
  return await deleteDoc(docRef);
}
