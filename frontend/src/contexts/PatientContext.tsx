import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Patient } from '@/types';
import { MOCK_PATIENTS } from '@/mock/patients';
import { STORAGE_KEYS } from '@/constants';

interface PatientContextValue {
  selectedPatient: Patient | null;
  patients: Patient[];
  selectPatient: (patient: Patient) => void;
}

const PatientContext = createContext<PatientContextValue | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients] = useState<Patient[]>(MOCK_PATIENTS);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_PATIENT);
    if (stored) {
      const found = MOCK_PATIENTS.find(p => p.id === stored);
      return found ?? MOCK_PATIENTS[0];
    }
    return MOCK_PATIENTS[0];
  });

  const selectPatient = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    localStorage.setItem(STORAGE_KEYS.SELECTED_PATIENT, patient.id);
  }, []);

  return (
    <PatientContext.Provider value={{ selectedPatient, patients, selectPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatientContext(): PatientContextValue {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatientContext must be used within PatientProvider');
  return ctx;
}
