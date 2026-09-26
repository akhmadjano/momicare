# MomiCare Backend

Maternal health monitoring API — hackathon MVP.  
Stack: **Spring Boot 3.2 · Java 17 · PostgreSQL · JWT**

> ⚠️ Demo data only. No real patients. Not production-ready.

---

## Quick start

### 1. Prerequisites

- Java 17+
- Maven 3.9+
- PostgreSQL 14+ running locally

### 2. Create the database

```sql
CREATE DATABASE momicare;
```

### 3. Configure environment variables

All secrets and environment-specific config are read from environment variables (see `src/main/resources/application.properties` for the full list of supported variables and their defaults).

Copy the template and fill in real values:

```bash
cp .env.example .env
```

At minimum, set:

```
DB_PASSWORD=your_real_db_password
JWT_SECRET=$(openssl rand -base64 48)
GEMINI_API_KEY=your_gemini_api_key_here   # optional, see below
```

Then export them before running (e.g. `export $(grep -v '^#' .env | xargs)`, or use a tool like `direnv`/your IDE's run-config env vars). **Never commit `.env`.**

Get a free Gemini API key at https://aistudio.google.com/app/apikey  
Free-tier limits: **15 requests/min, 1 million tokens/day** (Gemini 1.5 Flash).  
If no key is set the AI cross-check is silently skipped; everything else works normally.

### 4. Run

```bash
mvn spring-boot:run
```

The app starts on **http://localhost:8080**.  
On first startup the `DataSeeder` inserts demo data automatically.

### 5. Reseed demo data

Drop all rows and restart the app (the seeder only runs when `users` table is empty):

```sql
TRUNCATE activity_log, ai_checks, alerts, risk_scores, readings,
         doctor_patients, patients, users RESTART IDENTITY CASCADE;
```

Then restart the app.

---

## Demo credentials

| Role    | Login method | Username / Phone  | Password   |
|---------|-------------|-------------------|------------|
| patient | Phone only  | `998901234567`    | _(none)_   |
| nurse   | Username    | `nurse1`          | `demo1234` |
| doctor  | Username    | `doctor1`         | `demo1234` |
| admin   | Username    | `admin1`          | `demo1234` |

> **Security note:** Patient phone login has no OTP verification — this is intentional for the MVP. It **must** be replaced with real OTP before any production use.

---

## Role → Endpoint access table

| Endpoint | patient | nurse | doctor | admin |
|----------|:-------:|:-----:|:------:|:-----:|
| POST /api/auth/register | ✓ | ✓ | ✓ | ✓ |
| POST /api/auth/login-by-phone | ✓ | — | — | — |
| POST /api/auth/login | — | ✓ | ✓ | ✓ |
| POST /api/patients | — | ✓ | — | ✓ |
| GET /api/patients | ✗ | ✓ all | ✓ assigned | ✓ all |
| GET /api/patients/{id} | ✓ own only | ✓ | ✓ assigned | ✓ |
| POST /api/patients/{id}/readings | ✓ own | ✓ | ✓ assigned | ✓ |
| POST /api/patients/{id}/readings/parse-voice | ✓ own | ✓ | ✓ | ✓ |
| POST /api/patients/{id}/readings/voice | ✓ own | ✓ | ✓ | ✓ |
| GET /api/patients/{id}/risk | ✓ own | ✓ | ✓ assigned | ✓ |
| GET /api/patients/{id}/risk/history | ✓ own | ✓ | ✓ assigned | ✓ |
| GET /api/patients/{id}/risk/ai-checks | ✓ own | ✓ | ✓ assigned | ✓ |
| GET /api/patients/{id}/instructions | ✓ own | ✓ | ✓ assigned | ✓ |
| GET /api/alerts | ✗ | ✗ | ✓ assigned | ✓ all |
| PATCH /api/alerts/{id} | ✗ | ✗ | ✓ assigned | ✓ |
| GET /api/patients/{id}/activity | ✓ own | ✓ | ✓ assigned | ✓ |
| GET /api/regions/summary | ✗ | ✗ | ✗ | ✓ |
| POST /api/doctors/{dId}/patients/{pId} | ✗ | ✗ | ✗ | ✓ |

---

## All endpoints with example request/response

### Auth

#### POST /api/auth/register
```json
// Request
{ "name": "Malika Yusupova", "phoneNumber": "998901234567" }

// Response 200
{ "token": "eyJ...", "role": "patient", "userId": 5, "patientId": 3 }
```

#### POST /api/auth/login-by-phone
```json
// Request
{ "phoneNumber": "998901234567" }

// Response 200
{ "token": "eyJ...", "role": "patient", "userId": 5, "patientId": 3 }
```

#### POST /api/auth/login
```json
// Request
{ "username": "doctor1", "password": "demo1234" }

// Response 200
{ "token": "eyJ...", "role": "doctor", "userId": 2, "patientId": null }
```

---

### Patients

#### POST /api/patients
```json
// Request (nurse/admin)
{ "name": "Zulfiya K.", "phoneNumber": "998901112233", "pregnancyWeek": 24,
  "district": "Chilonzor", "assignDoctorId": 2 }

// Response 201 — PatientDetailDto
{ "id": 4, "name": "Zulfiya K.", "pregnancyWeek": 24, "district": "Chilonzor",
  "currentRiskLevel": null, "currentTrend": null, "readings": [], "assignedDoctors": [
    { "id": 2, "name": "Dr. Bobur Toshmatov" }
  ] }
```

#### GET /api/patients
```json
// Response 200 — array of PatientSummaryDto
[
  { "id": 1, "name": "Malika Yusupova", "pregnancyWeek": 28, "district": "Yunusabad",
    "currentRiskLevel": "Critical", "currentTrend": "increasing", "hasAiReviewFlag": true }
]
```

#### GET /api/patients/{id}
```json
// Response 200 — PatientDetailDto with full reading history
{
  "id": 1, "name": "Malika Yusupova", "pregnancyWeek": 28,
  "currentRiskLevel": "Critical", "currentTrend": "increasing",
  "currentKeyFactors": ["BP dangerously high (155/100)", "Severe neurological symptoms"],
  "readings": [
    { "id": 6, "bloodPressure": "155/100", "heartRate": 98,
      "symptoms": "Very severe headache, visual disturbances, nausea",
      "source": "nurse", "recordedAt": "2026-09-26T10:00:00Z" }
  ],
  "assignedDoctors": [{ "id": 2, "name": "Dr. Bobur Toshmatov" }]
}
```

---

### Readings

#### POST /api/patients/{id}/readings
```json
// Request
{ "bloodPressure": "148/96", "heartRate": 94,
  "symptoms": "Severe headache, blurred vision", "source": "nurse" }

// Response 200 — RiskResultDto (returned immediately; AI check fires async)
{ "riskLevel": "High", "trend": "increasing",
  "keyFactors": ["BP critically elevated (148/96)", "Severe headache", "Visual symptoms"],
  "calculatedAt": "2026-09-26T10:05:00Z" }
```

#### POST /api/patients/{id}/readings/parse-voice
```json
// Request
{ "text": "Qon bosimi 135 ga 85, yurak urishi 88" }

// Response 200 — never saved, confirm step required before save
{ "rawTranscript": "Qon bosimi 135 ga 85, yurak urishi 88",
  "bloodPressure": "135/85", "heartRate": 88, "symptoms": null }
```

#### POST /api/patients/{id}/readings/voice
```
// Request: multipart/form-data, field name "audio"
// Response 200
{ "rawTranscript": "Qon bosimi 130 ga 85, yurak urishi 88, bosh og'riq bor",
  "bloodPressure": "130/85", "heartRate": 88, "symptoms": null }
```

---

### Risk

#### GET /api/patients/{id}/risk
```json
{ "riskLevel": "Critical", "trend": "increasing",
  "keyFactors": ["BP dangerously high (155/100)", "Severe neurological symptoms",
                 "Multiple warning signs for pre-eclampsia/eclampsia"],
  "calculatedAt": "2026-09-26T10:00:00Z" }
```

#### GET /api/patients/{id}/risk/history
```json
[
  { "riskLevel": "Low",      "trend": "stable",     "keyFactors": [...], "calculatedAt": "..." },
  { "riskLevel": "Moderate", "trend": "increasing", "keyFactors": [...], "calculatedAt": "..." },
  { "riskLevel": "High",     "trend": "increasing", "keyFactors": [...], "calculatedAt": "..." },
  { "riskLevel": "Critical", "trend": "increasing", "keyFactors": [...], "calculatedAt": "..." }
]
```

#### GET /api/patients/{id}/risk/ai-checks
```json
[
  { "id": 1, "patientId": 1, "readingId": 6,
    "ruleBasedRiskLevel": "High", "aiRiskLevel": "Critical",
    "aiReasoning": "Blood pressure 148/96 with severe headache and visual disturbances strongly suggests pre-eclampsia.",
    "matchStatus": "MISMATCH", "checkedAt": "2026-09-26T10:05:05Z" }
]
```

#### GET /api/patients/{id}/instructions
```json
{ "headline": "Contact your doctor or midwife today",
  "tips": ["Call your healthcare provider and describe your current symptoms",
           "Rest and avoid strenuous activity",
           "Monitor your blood pressure every few hours if possible",
           "Go to the emergency room if symptoms worsen"],
  "basedOn": "Risk level: High, Trend: increasing. Key factors: BP significantly elevated (148/96); Severe headache" }
```

---

### Alerts

#### GET /api/alerts
```json
[
  { "id": 3, "patientId": 1, "patientName": "Malika Yusupova",
    "priority": "Critical", "status": "Alert", "needsAiReview": true,
    "createdAt": "2026-09-26T10:00:00Z", "updatedAt": "2026-09-26T10:00:00Z" },
  { "id": 2, "patientId": 1, "priority": "High", "status": "FollowUpScheduled",
    "needsAiReview": false, "createdAt": "..." }
]
```

#### PATCH /api/alerts/{id}
```json
// Request
{ "status": "Reviewed" }

// Response 200 — updated AlertDto
{ "id": 3, "status": "Reviewed", "needsAiReview": true, ... }
```

---

### Activity log

#### GET /api/patients/{id}/activity?limit=20&offset=0
```json
[
  { "id": 6, "type": "reading",
    "detail": "Nurse recorded vitals: BP 155/100, HR 98 — Critical alert raised",
    "occurredAt": "2026-09-26T10:00:00Z" },
  { "id": 5, "type": "alert_viewed", "detail": "Doctor reviewed Moderate alert", "occurredAt": "..." }
]
```

---

### Regional (admin only)

#### GET /api/regions/summary
```json
[
  { "district": "Chilonzor",       "patientCount": 1, "dominantRiskLevel": "Low" },
  { "district": "Mirzo Ulugbek",   "patientCount": 1, "dominantRiskLevel": "Low" },
  { "district": "Yunusabad",       "patientCount": 1, "dominantRiskLevel": "Critical" }
]
```

---

### Doctor-patient assignment (admin only)

#### POST /api/doctors/{doctorId}/patients/{patientId}
```json
// Response 200
{ "message": "Patient 3 assigned to doctor 2" }
```

---

## AI provider

- **Provider:** Google Gemini 1.5 Flash (free tier)
- **Free-tier limits:** 15 requests/min · 1 million tokens/day
- **Interface:** `RiskCrossCheckService` — swap the implementation bean to use HuggingFace or Ollama
- The rule-based engine is always the source of truth. AI output is a review flag only and never blocks reading saves
- Set `app.ai.provider=disabled` or leave `app.ai.gemini.api-key=YOUR_...` to disable AI checks entirely

---

## Risk engine rules

| Risk level | Condition |
|------------|-----------|
| **Critical** | Systolic ≥ 160 **or** Diastolic ≥ 105 **or** HR ≥ 120 **or** critical symptom keyword |
| **High** | 3+ worsening indicators |
| **Moderate** | 2 worsening indicators |
| **Low** | Fewer than 2 worsening indicators |

Trend is computed from the last 3 risk scores, not just the most recent two readings.

---

## Security notes

- JWT is HS256, 24-hour expiry — change `app.jwt.secret` before any real deployment
- Phone-only login has **no OTP** — must be replaced before production
- Passwords are BCrypt-hashed (cost factor 10)
- CORS is restricted to `localhost:3000` by default
