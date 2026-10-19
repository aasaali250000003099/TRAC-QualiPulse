# TRAC QualiPulse: Tawi-Tawi Regional Agricultural College Quality Audit & Intelligence System

An institutional quality self-audit and workforce intelligence platform custom-engineered for **Tawi-Tawi Regional Agricultural College (TRAC)**, powered by **Gemini 3.6 Flash** and **Cloud Firestore**. 

TRAC QualiPulse enables college faculty, researchers, extension specialists, and administrative staff to conduct confidential, structured multi-turn quality audits covering instructional workflows, laboratory and agricultural research difficulties, institutional friction, and innovations—evaluated against official college benchmarks and AACCUP/CHED standards uploaded by the Super Administrator. All submissions are strictly user-isolated in Firestore to guarantee privacy and academic freedom.

---

## 🏛️ Institution Details & Theme
- **Institution**: Tawi-Tawi Regional Agricultural College (TRAC), Nalil, Bongao, Tawi-Tawi, Philippines.
- **Charter**: Established on April 8, 1983, under Batas Pambansa Blg. 384.
- **Visual Identity**: Official TRAC Emblem & Seal, styled in the college's official **Green and White** color mix palette with ambient emerald glassmorphism.
- **Emblem Assets**: High-resolution official seal at `/public/trac-logo-512.png`, `/public/trac-logo-128.png`, and browser favicon at `/public/favicon.png`.

---

## 🛡️ Agentic Threat Modeling Summary (5 Threat Zones)

| Threat Zone | Identified Risks | Countermeasures & Defensive Architecture |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious injection in faculty role descriptions, reflection inputs, complaints, or uploaded college quality criteria; XSS vectors. | Strict TypeScript schema validation, payload length limits (10,000 chars), defensive destructuring, React text-only escaping, zero raw HTML injection. |
| **2. Planning & Reasoning** | Prompt injection attempting to alter Gemini evaluation rubrics or exfiltrate cross-user records. | Delimited system instructions, role-bound context framing, strict JSON output schema parsing with structured field validation. |
| **3. Tool & Server Execution** | Upstream API outages, rate limits (429), or service unavailability (503). | Resilient 4-tier model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`); payload ingestion middleware order guarantee. |
| **4. Memory & State** | Cross-faculty document tampering or unauthorized reads in Firestore; admin privilege escalation. | Strict owner-bound Firestore security rules (`request.auth.uid == userId`); verified Super Admin checks restricted strictly to `aasaali_250000003099@uic.edu.ph`. |
| **5. Inter-System Communication** | Token interception, API key leakage, hardcoded credentials. | Zero hardcoded keys; operational secrets retrieved via environment variable injection and Google Cloud Secret Manager. |

---

## 🌟 Key Application Features

1. **Super Administrator Governance**:
   - Designated Super Administrator (`aasaali_250000003099@uic.edu.ph`) authenticated securely via Google SSO.
   - Authoritative upload and management of TRAC institutional quality standards, AACCUP Area I-X criteria, CHED CMOs, and ISO 9001:2015 rubrics.
   - Comprehensive cross-department audit results inspection.
   - One-click executive AI synthesis summarizing institutional health, faculty bottlenecks, and strategic priorities.
2. **Confidential Workforce Audits**:
   - Google SSO federated identity (zero stored passwords).
   - Academic background configuration (role in college, department/institute, detailed job function description).
   - Multi-turn information exchanges with Gemini 3.6 Flash covering Work Processes, Bottlenecks & Challenges, Complaints & Roadblocks, Suggestions for Innovation, and Open Reflection.
3. **Structured Gemini 3.6 Flash Feedback**:
   - Conversational dialogue response with empathic, professional tone.
   - Executive root-cause analysis and institutional insights.
   - High-leverage brainstorming ideas and alternative workflow designs.
   - Concrete, actionable next steps.
   - Quality assessment score and compliance categorization.
4. **Zero-Trust Security & Strict Isolation**:
   - ABAC Firestore Security Rules enforcing owner-bound isolation (`request.auth.uid == userId`).
   - Server-side Gemini API proxy with automated model fallback ladder.
   - Strict undefined-stripping and guaranteed transaction verification.

---

## 🛡️ Firestore Security Rules

Deploy the owner-bound security rules to protect employee audit submissions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isSuperAdmin() {
      return isSignedIn() &&
        request.auth.token.email == 'aasaali_250000003099@uic.edu.ph' &&
        request.auth.token.email_verified == true;
    }

    function isAdmin() {
      return isSuperAdmin() ||
        (isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid)));
    }

    // Company standards readable by authenticated users; managed strictly by admin
    match /company_standards/{standardId} {
      allow get, list: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }

    // User profiles & user-isolated audit interactions
    match /users/{userId} {
      allow get: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow list: if isAdmin();
      allow create, update: if isSignedIn() && request.auth.uid == userId;
      allow delete: if isAdmin() || (isSignedIn() && request.auth.uid == userId);

      match /interactions/{interactionId} {
        allow get, list: if isSignedIn() && (request.auth.uid == userId || isAdmin());
        allow create, update: if isSignedIn() && request.auth.uid == userId;
        allow delete: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      }
    }

    // Collection group for admin reporting
    match /{path=**}/interactions/{interactionId} {
      allow list: if isAdmin();
    }
  }
}
```

---

## 🔐 Google Cloud Secret Manager Setup

Store your Gemini API key in Google Cloud Secret Manager to eliminate hardcoded credentials:

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 3. Add the secret payload version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 4. Grant Cloud Run default service account permission to access the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment Flow

Deploy TRAC QualiPulse as a containerized full-stack application directly from source:

```bash
# 1. Enable required Cloud services
gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com

# 2. Deploy to Cloud Run mounting the Secret Manager secret
gcloud run deploy trac-qualipulse \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars=NODE_ENV=production

# 3. Apply Mandatory Verification Label for the Cloud Run Challenge
gcloud run services update trac-qualipulse \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region asia-southeast1
```

---

## 🧪 Functional Walkthrough & Test Guide

| Step | User Role | Action / Interaction | Expected System Behavior |
| :--- | :--- | :--- | :--- |
| **TC-1** | Visitor | Click "Sign In with Google SSO" on Landing Page | Displays Google sign-in popup; on authentication, transitions smoothly into the green & white faculty dashboard with TRAC logo. |
| **TC-2** | Faculty / Staff | Navigate to "Role Profile" tab, enter Job Role & Description, click "Save Background" | Updates `/users/{uid}` in Firestore with sanitized payload; confirms success with green toast notification. |
| **TC-3** | Faculty / Staff | Select topic "Difficulties & Bottlenecks", type workplace issue or click "Insert sample text" | Character counter dynamically tracks text length up to 10,000 characters. |
| **TC-4** | Faculty / Staff | Click "Submit for Audit & Insights" | Calls `/api/gemini/analyze` using the resilient fallback ladder; persists prompt & output to `/users/{uid}/interactions/{id}`; displays structured feedback cards (summary, brainstorming, action steps). |
| **TC-5** | Faculty / Staff | Navigate to "My History" tab | Shows chronological list of private audits with topic badges; supports keyword search, expandable inspection, and JSON export. |
| **TC-6** | Super Admin | Sign in with `aasaali_250000003099@uic.edu.ph` | Top navigation displays golden "Super Admin" badge and enables the Admin Command Portal. |
| **TC-7** | Super Admin | Open "Super Admin" &rarr; "Standards & Basis", click a preset or type SOP, click "Publish" | Persists standard to `/company_standards/{stdId}`; instantly visible to all users via "Quality Standards" modal. |
| **TC-8** | Super Admin | Switch to "User Audits" tab | Queries across departments and displays auditee submissions without exposing records to regular employees. |
| **TC-9** | Super Admin | Switch to "Executive AI Synthesis", click "Generate Executive Audit Synthesis" | Calls `/api/gemini/summarize-audit` to synthesize all cross-user submissions into an executive intelligence report. |
| **TC-10** | Security | Cross-User Access Test (User B tries reading `/users/UserA/interactions`) | Firestore rule blocks request with `PERMISSION_DENIED`. |
