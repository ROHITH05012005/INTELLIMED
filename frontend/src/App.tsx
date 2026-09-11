import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PatientProvider } from '@/contexts/PatientContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

// Pages (lazy-loaded)
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const MedicationsPage = lazy(() => import('@/pages/medications/MedicationsPage'));
const MedicationDetailPage = lazy(() => import('@/pages/medications/MedicationDetailPage'));
const NewMedicationPage = lazy(() => import('@/pages/medications/NewMedicationPage'));
const PatientsPage = lazy(() => import('@/pages/patients/PatientsPage'));
const PatientDetailPage = lazy(() => import('@/pages/patients/PatientDetailPage'));
const AdherencePage = lazy(() => import('@/pages/adherence/AdherencePage'));
const AlertsPage = lazy(() => import('@/pages/alerts/AlertsPage'));
const DevicePage = lazy(() => import('@/pages/device/DevicePage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PatientProvider>
            <NotificationProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/medications" element={<MedicationsPage />} />
                      <Route path="/medications/new" element={<NewMedicationPage />} />
                      <Route path="/medications/:id" element={<MedicationDetailPage />} />
                      <Route path="/patients" element={<PatientsPage />} />
                      <Route path="/patients/:id" element={<PatientDetailPage />} />
                      <Route path="/adherence" element={<AdherencePage />} />
                      <Route path="/alerts" element={<AlertsPage />} />
                      <Route path="/device" element={<DevicePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </Route>
                  </Route>

                  {/* Redirects */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </NotificationProvider>
          </PatientProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
