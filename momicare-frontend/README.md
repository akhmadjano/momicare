# MomiCare Frontend

React UI for the MomiCare maternal health monitoring MVP.  
Stack: **Vite · React 18 · React Router 6 · rough.js · axios**

> ⚠️ Demo data only. Requires the backend running at `http://localhost:8080`.

---

## Quick start

### Prerequisites

- Node.js 18+
- The MomiCare backend running on port 8080 (see `../momicare-backend/README.md`)
- Microphone permission for voice check-in/nurse entry (optional — falls back to text)

### Install and run

```bash
cd momicare-frontend
npm install
npm run dev
```

Opens at **http://localhost:3000**

### Build for production

```bash
npm run build
```

---

## CORS

The Spring Boot backend must allow requests from `http://localhost:3000`.  
This is already configured via `app.cors.allowed-origins=http://localhost:3000` in `application.properties`.

---

## Design system — "black pen sketch on white"

All UI is hand-drawn-style using **rough.js** — no component library.

| Component | File | Purpose |
|-----------|------|---------|
| `SketchButton` | `src/components/SketchButton.jsx` | Rough-bordered button, variant=default/primary/danger |
| `SketchCard` | `src/components/SketchCard.jsx` | Rough-bordered card container (ResizeObserver) |
| `RiskBadge` | `src/components/RiskBadge.jsx` | Severity circle — fill style only, never colour |
| `SketchLineChart` | `src/components/SketchLineChart.jsx` | Hand-sketched risk history line chart |
| `TrendArrow` | `src/components/TrendArrow.jsx` | ↑ / → / ↓ trend indicator |

### RiskBadge fill convention

| Risk level | Fill style |
|------------|-----------|
| Low | Plain outline (no fill) |
| Moderate | Single-hatch fill |
| High | Cross-hatch fill |
| Critical | Solid black (white text) |

Pass `mismatch={true}` to add an "AI ⚑" annotation below the badge.

### Typography

- Headings / labels: `Kalam` (Google Font, loaded in `index.html`)
- Data / numbers: `JetBrains Mono` (class `mono`)
- Body / inputs: `Patrick Hand`

---

## Pages and routes

| Route | Role | Description |
|-------|------|-------------|
| `/login` | all | Patient phone login or staff username/password (tab toggle) |
| `/register` | all | Patient self-registration |
| `/checkin` | patient | Branching Q&A + voice recording check-in |
| `/my-activity` | patient | Risk chart, instructions card, paginated activity timeline |
| `/nurse` | nurse | Vitals form, voice/text entry, offline queue |
| `/dashboard` | doctor, admin | Patient table with risk badges and trend arrows |
| `/dashboard/:id` | doctor, admin | Patient detail: chart, AI check, alerts, readings |
| `/regional` | admin | District-level risk summary (anonymised) |
| `/admin/assignments` | admin | Assign doctors to patients |
| `/not-authorized` | all | 403 redirect target |

Route guards redirect unauthenticated users to `/login` and wrong-role users to `/not-authorized`. Any `403` API response also redirects to `/not-authorized`.

---

## Auth flow

1. Login / register → backend returns `{ token, role, userId, patientId }`
2. Stored in `localStorage` under key `momicare_auth`
3. `src/api/client.js` attaches `Authorization: Bearer <token>` to every request
4. `AuthContext` exposes `auth`, `login()`, `logout()`
5. Patient routes always use `auth.patientId` — never a URL parameter

---

## Voice recording

- Uses the browser **MediaRecorder API** (`audio/webm`)
- Patient check-in (`/checkin`) and nurse entry (`/nurse`) both support recording
- On stop: audio blob is POSTed to `POST /api/patients/{id}/readings/voice`
- Backend returns `{ rawTranscript, bloodPressure, heartRate }`
- User sees a **confirm screen** with editable parsed fields before any save
- If mic permission is denied the UI falls back to a text field + `/parse-voice`

> **Note:** The backend ships a stub STT service that returns a fixed Uzbek demo transcript. Wire in a real Vosk/Whisper model via the `SpeechToTextService` interface.

---

## Offline support (nurse page)

- Detects `navigator.onLine`
- Entries created while offline are saved to `localStorage` (`momicare_offline_queue`)
- On reconnect (`window` `online` event), the queue is automatically synced
- A manual "Sync now" button is also available
- The queue panel shows all pending entries

---

## Project structure

```
src/
  api/           axios wrappers (auth, patients, alerts, regional, doctors)
  components/    SketchButton, SketchCard, RiskBadge, SketchLineChart, TrendArrow, NavBar
  context/       AuthContext — token/role/patientId storage
  pages/         One component per page (see routes table above)
  index.css      Global reset + sketch-notebook base styles
  App.jsx        Router, RequireAuth, RoleRedirect
  main.jsx       Entry point
```

---

## Demo credentials

| Role | Login | Credential |
|------|-------|-----------|
| patient | Phone: `998901234567` | no password |
| nurse | Username: `nurse1` | `demo1234` |
| doctor | Username: `doctor1` | `demo1234` |
| admin | Username: `admin1` | `demo1234` |

---

## Notes

- **Phone-only login** has no OTP verification — intentional for MVP. Needs real OTP before production.
- CORS must be enabled on the backend for `localhost:3000` (already configured).
- The app uses only black/white — severity is communicated through fill patterns on `RiskBadge`, never through colour. This ensures the UI remains usable when printed or in greyscale.
- Full WCAG compliance requires manual testing with assistive technologies and an expert accessibility review beyond what automated tools can verify.
