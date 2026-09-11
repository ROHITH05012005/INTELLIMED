import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ReminderItem {
  id: string;
  medicineName: string;
  time: string;
  dosage: string;
  enabled: boolean;
  takenToday: boolean;
}

let remindersStore: ReminderItem[] = [
  {
    id: '1',
    medicineName: 'Paracetamol',
    time: '08:00',
    dosage: '1 Tablet after breakfast',
    enabled: true,
    takenToday: true,
  },
  {
    id: '2',
    medicineName: 'Amoxicillin',
    time: '14:00',
    dosage: '1 Capsule after lunch',
    enabled: true,
    takenToday: false,
  },
  {
    id: '3',
    medicineName: 'Vitamin D3',
    time: '20:30',
    dosage: '1 Tablet with milk',
    enabled: true,
    takenToday: false,
  },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: remindersStore });
  }

  if (req.method === 'POST') {
    const { medicineName, time, dosage } = req.body || {};
    if (!medicineName || !time) {
      return res.status(400).json({ error: 'medicineName and time are required' });
    }
    const newReminder: ReminderItem = {
      id: Date.now().toString(),
      medicineName,
      time,
      dosage: dosage || '1 Dose',
      enabled: true,
      takenToday: false,
    };
    remindersStore.push(newReminder);
    return res.status(201).json({ success: true, data: newReminder });
  }

  if (req.method === 'PATCH') {
    const { id, enabled, takenToday } = req.body || {};
    const item = remindersStore.find((r) => r.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    if (typeof enabled === 'boolean') item.enabled = enabled;
    if (typeof takenToday === 'boolean') item.takenToday = takenToday;
    return res.status(200).json({ success: true, data: item });
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id as string) || (req.body?.id as string);
    remindersStore = remindersStore.filter((r) => r.id !== id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
