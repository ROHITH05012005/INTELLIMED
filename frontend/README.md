# INTELLIMED Frontend

**Smart medication. Safer routines.**

A modern, production-quality healthcare IoT dashboard for the INTELLIMED medication monitoring system.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Forms | React Hook Form + Zod |
| Testing | Vitest + RTL |

---

## Quick Start

```bash
cd frontend

# Copy env
cp .env.example .env

# Install
npm install

# Run dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Patient | patient@intellimed.com | Patient@123 |
| Caregiver | caregiver@intellimed.com | Caregiver@123 |
| Admin | admin@intellimed.com | Admin@123 |

---

## Project Structure

```
src/
├── assets/
├── components/
│   ├── layout/          # AppShell, Sidebar, TopNav
│   └── dashboard/       # KPICards, NextDoseCard, Timeline, etc.
├── pages/
│   ├── auth/            # LoginPage
│   ├── dashboard/       # DashboardPage
│   ├── medications/     # MedicationsPage, MedicationDetailPage, NewMedicationPage
│   ├── patients/        # PatientsPage, PatientDetailPage
│   ├── adherence/       # AdherencePage
│   ├── alerts/          # AlertsPage
│   ├── device/          # DevicePage
│   ├── settings/        # SettingsPage
│   └── profile/         # ProfilePage
├── services/            # API service layer (mock + real)
├── contexts/            # Auth, Theme, Patient, Notifications
├── hooks/               # useCountdown, etc.
├── mock/                # Synthetic demo data
├── types/               # TypeScript interfaces
├── constants/           # Routes, nav config, labels
└── utils/               # adherence.ts, formatting.ts, cn.ts
```

---

## Features

- ✅ Role-based navigation (Patient / Caregiver / Admin)
- ✅ Authentication with validation
- ✅ Dashboard with live countdown timer
- ✅ Medication management (CRUD)
- ✅ Patient management table
- ✅ Adherence analytics with Recharts
- ✅ Alert center with filtering
- ✅ IoT device monitoring with compartment grid
- ✅ Dark / Light / System theme
- ✅ Responsive mobile layout
- ✅ Mock data layer (separates from real API)
- ✅ API service layer ready for backend integration

---

## API Integration

Set `VITE_USE_MOCK=false` in `.env` and point `VITE_API_BASE_URL` to the FastAPI backend:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCK=false
```

All service modules in `src/services/` will automatically switch to real HTTP calls.

---

## Commands

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run test     # Unit tests
npm run lint     # Lint
```

---

© 2026 INTELLIMED | Smart India Hackathon
