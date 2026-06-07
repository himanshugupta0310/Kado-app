# Kado Doctor — Agent Context

## Stack
Vanilla JS SPA, no build step. Mobile-first. Single `index.html` + 13 JS files loaded in order.

## File Load Order (dependency chain)
```
api.js → state.js → utils.js → auth.js → patients.js → patient-detail.js
→ records.js → summary.js → review.js → invite.js → main.js
```
Plus `/env.js` (sets `window.__KADO_API__`).

## Context Graph
```
index.html
├── css/styles.css          Design tokens, screen/modal layouts
└── js/
    ├── api.js              apiFetch(path) — GET wrapper; API base URL
    ├── state.js            Global vars (no framework)
    ├── utils.js            showScreen(), setMode(), logoutDoctor(), getReportIcon()
    ├── auth.js             handleLogin(), registerDoctor() — phone-based
    ├── main.js             window.load → restore from localStorage
    ├── patients.js         loadPatientsScreen(), loadPatients(), openPatient(i)
    ├── patient-detail.js   switchTab(), openPatientNotesModal(), savePatientNotes()
    ├── records.js          loadPatientRecords(), loadPrescriptions(), uploadPrescription()
    ├── summary.js          loadDoctorSummary(), triggerSummaryGeneration(), printDoctorSummary()
    ├── review.js           openVetModal/openEditModal/openInfoModal(), submitReview(status)
    └── invite.js           openInvitePatientSheet(), sendPatientInvite(), selectInviteLanguage()
```

## Global State (`state.js`)
| Var | Type | Values |
|-----|------|--------|
| `currentDoctor` | obj\|null | `{id, name, specialization, ...}` |
| `currentPatient` | obj\|null | patient object |
| `currentPatientNotes` | obj | `{diagnosis?, procedure?, note?}` |
| `activeKadoId` | str\|null | kado-card ID for review |
| `currentTab` | str | `records` / `recs` / `summary` |
| `activeBucket` | str | `all` / `blood` / `imaging` / `prescription` / `other` |
| `selectedInviteLanguage` | str | `english` / `hindi` / `hinglish` / `punjabi` / `kannada` |
| `doctorSummaryType` | str | `general` / `speciality` |
| `doctorSummarySpeciality` | str | doctor's specialization |
| `allReports` | arr | all patient records (for bucket filtering) |
| `docInviteMethod` | str | `whatsapp` / `email` |
| `window._patients` | arr | patient list cache |
| `window._patientNotes` | obj | `{[patientId]: notes}` cache |

## Screens & Modals
| ID | Type | Trigger |
|----|------|---------|
| `screen-login` | Screen | initial / logout |
| `screen-patients` | Screen | after login, mode=professional |
| `screen-patient-detail` | Screen | openPatient(i) |
| `screen-doctor-profile` | Screen | avatar click |
| `screen-personal` | Screen | setMode('personal') |
| `invite-patient-overlay` | Sheet | FAB / openInvitePatientSheet() |
| `patient-notes-modal` | Modal | edit notes button |
| `speciality-modal` | Modal | summary type=speciality, no spec set |
| `vet-modal` | Modal | openVetModal(kadoId) |
| `edit-modal` | Modal | openEditModal(kadoId, text) |
| `info-modal` | Modal | openInfoModal(kadoId) |

Switch screens via `showScreen(name)` (hides all, shows one).

## Data Flow
```
Login
  handleLogin() → GET /user?phone=
    ├─ doctor exists → localStorage + loadPatientsScreen()
    └─ not doctor / new → show register fields → registerDoctor()
         → POST /doctor/register → localStorage + loadPatientsScreen()

Patients List
  loadPatientsScreen() → loadPatients()
    → GET /doctor/patients
    → parallel: GET /records?patient_id= (count)
    → parallel: GET /patients/<id>/doctor-notes?doctor_id=
    → render cards → cache window._patients, window._patientNotes
    → click card → openPatient(i)

Patient Detail
  openPatient(i) → currentPatient set → switchTab('records')
  switchTab():
    records  → loadPatientRecords() → GET /records → renderRecordsBucket()
    recs     → loadPrescriptions() → GET /records → filter by doctor + prescription
    summary  → loadDoctorSummary() → GET /patients/:id/summary?type=doctor&speciality=
               → if no cache: show generate button
               → triggerSummaryGeneration() → POST /patients/:id/summary

Notes Edit
  savePatientNotes() → POST /patients/:id/doctor-notes
    → update state + cache → renderPatientDetailBars() + loadPatients()

Review (Kado Cards)
  submitReview('vetted'|'edited'|'needs_info')
    → PATCH /kado-cards/:id/review {doctor_id, doctor_status, ...}

Invite
  sendPatientInvite()
    → POST /doctor/invite-patient {doctor_user_id, language?, phone_number?, email?}
```

## API Endpoints
Base: `window.__KADO_API__` || `https://api.kado.care`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/user?phone=` | check doctor exists |
| POST | `/doctor/register` | create doctor `{phone_number, name, specialization}` |
| GET | `/doctor/patients?doctor_id=` | list patients |
| GET | `/records?patient_id=` | all patient records |
| GET | `/patients/:id/doctor-notes?doctor_id=` | doctor's notes |
| POST | `/patients/:id/doctor-notes` | save `{doctor_id, diagnosis, procedure, note}` |
| POST | `/doctor/upload-report` | FormData: file, patient_id, doctor_id, document_type |
| PATCH | `/doctor/update-profile` | `{doctor_id, specialization}` |
| POST | `/doctor/invite-patient` | `{doctor_user_id, language?, phone_number?, email?}` |
| GET | `/patients/:id/summary?type=doctor&speciality=` | fetch cached summary |
| POST | `/patients/:id/summary` | `{type:'doctor', speciality}` — generate |
| PATCH | `/kado-cards/:id/review` | `{doctor_id, doctor_status, doctor_note?, doctor_edit?, needs_info_question?}` |

## Key Data Schemas
```js
Doctor:       { id, name, phone_number, specialization, user_type:'doctor' }
Patient:      { id, name, age, gender }
DoctorNotes:  { diagnosis?, procedure?, note? }  // comma-separated for diagnosis/procedure
HealthRecord: { id, patient_id, file_url, report_type, document_type, report_date,
                disease_tags:[], identity_confirmed, uploaded_by_doctor_ids:[] }
Summary:      { summary?:{ content:HTML, biomarker_trends?, report_count }, is_stale, current_report_count }
KadoReview:   { doctor_id, doctor_status:'vetted'|'edited'|'needs_info',
                doctor_note?, doctor_edit?, needs_info_question? }
```

## Record Bucket Classification (`records.js:getBucket()`)
```
blood        → report_type includes: blood, lab, pathology, haematology, biochemistry
imaging      → includes: mri, ct scan, x-ray, xray, ultrasound, usg, pet scan, dexa, mammogram, angiograph, radiolog
prescription → includes: prescription, consultation
other        → default
```
Records grouped by month (newest first) within each bucket.

Prescriptions tab: filter `document_type === 'prescription'` AND `uploaded_by_doctor_ids` includes doctor.

## Summary Types
- `general` — full history overview
- `speciality` — doctor's field focused; prompts for speciality if not set
- Stale flag shown if new records added since summary
- Share via print dialog (`printDoctorSummary()`)

## Review Statuses
- `vetted` → doctor approved, optional `doctor_note`
- `edited` → doctor corrected, provides `doctor_edit` text
- `needs_info` → doctor asks question via `needs_info_question`

## Invite Channels
- WhatsApp: 10-digit phone, +91 prefix added, language selector shown
- Email: email input, no language selector
- Languages: english, hindi, hinglish, punjabi, kannada

## localStorage
- Key: `kado_doctor`, Value: JSON doctor object
- Cleared on logout (`logoutDoctor()`)
- Restored on `window.load` in main.js

## Design Tokens
- Primary blue: `#2D6BE4`
- Success green: `#2D8A6A`
- Error red: `#C0392B`
- Fonts: Fraunces (headings), DM Sans (body)
- Mobile-first, 380px max-width cards
