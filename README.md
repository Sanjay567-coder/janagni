# JanAgni — Civic Grievance Escalation App

JanAgni is a mobile-first civic grievance escalation application. Built using Next.js 14, TypeScript, Tailwind CSS, Firestore, and the Gemini API, it provides citizens with a way to log civic complaints (via speech or text), track statutory resolution deadlines under **G.O. (Ms) No. 99**, and automatically trigger legal drafts (Section 6(1) RTIs and Article 226 High Court writ petitions) if authorities fail to act.

---

## 🎨 Design System: Ink & Ember
JanAgni utilizes a locked design language tailored for modern, premium aesthetics:
- **Backgrounds:** `#0F1218` Deep Ink, fading into a subtle top ember radial gradient.
- **Gradients:** `#F5A623` (Ember Gold) $\rightarrow$ `#E4572E` (Ember Orange) for active escalation and warning states.
- **Calm Accents:** `#5B8AA6` (Slate Blue) for early SLA states, `#7FA687` (Sage Green) for resolved/verified states.
- **Typography:**
  - **Fraunces:** Serif font for display headings and brand identity.
  - **IBM Plex Sans:** Clean body font.
  - **IBM Plex Mono:** Highly legible monospaced font for ticket IDs, statistics, and legal data.
  - **Noto Sans Tamil:** Scoped strictly to Tamil text runs for proper glyph rendering.

---

## 🚀 Features

### 1. Multilingual Intelligent Intake (Voice & Text)
- **Voice Ingestion:** Record audio directly from the browser using the `MediaRecorder` API. The audio stream is sent to a Next.js Server Action and parsed using the Gemini API to extract:
  - Clean English transcript
  - Civic category (e.g. Sanitation & Drainage, Potholes, etc.)
  - Location/Ward details (e.g. Ward 172, Velachery, Chennai)
  - Grievance severity (Low, Medium, High)
- **Voice Fallback:** Full support for typing and editing in the text area if microphone permissions are denied or unavailable.
- **Demo Resilience:** API calls are wrapped in a **3-second timeout** and automatically fall back to local regex-filled template data if the API is slow, offline, or if the `GEMINI_API_KEY` is missing, ensuring your demo never crashes in front of an audience.

### 2. SLA Tracker & 4-Stage Flame Stepper
- Circular countdown ring that maps the 30-day statutory resolution timeline.
- **Milestone Stepper:**
  1. **Filed:** Initial entry under G.O. (Ms) No. 99.
  2. **Supervisory Nudge:** Triggered on Day 30 if unresolved, alerting Zonal Commissioners.
  3. **RTI Drafted:** Triggered on Day 37, auto-drafting a Section 6(1) RTI application.
  4. **Writ Escalated:** Triggered on Day 45+, generating an Article 226 High Court writ petition citing the Madras HC judgment *Mumoorthy v. District Collector*.

### 3. Legal Document Compiler
- Renders signed statutory documents within a modal previewer.
- Generates and downloads standard, print-ready PDF files directly from the browser using `jspdf`.

### 4. Officer Portal & Verification
- **KPI Metrics:** Track Active Tickets, SLA Breaches, Active RTIs, and Average Resolution Time.
- **Compliance Registry:** Horizontally scrollable tabular view of all grievances, active stages, and authority response actions.
- **Resolution Verification:** If a ticket is marked "Resolved", citizens can review the work, choosing to "Confirm resolved" or mark it "Not actually fixed" (which automatically reverts the ticket to the escalated stage).

---

## 🛠️ Local Setup

### 1. Install Dependencies
Clone the repository, navigate to the project directory, and install dependencies:
```bash
npm install
```

### 2. Configure Environment (`.env.local`)
Create a `.env.local` file at the root of the project:
```env
# Gemini API Key (Required for live transcription and document drafting)
GEMINI_API_KEY=your_gemini_key_here

# Firebase configuration keys (Optional — falls back to local in-memory DB if missing)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Demo Mode Instructions
1. **Reset Demo:** Tap the floating "Reset" or "Clear DB" buttons in the Demo Control panel to clear historical entries.
2. **File Complaint:** Speak or type a new complaint.
3. **Time Progression:** Tap **"Advance time →"** in the Demo Control panel. Watch the SLA ring drain, status notes adapt, and the milestone stepper light up.
4. **Download PDFs:** Once the timeline advances to Day 37 (RTI) or Day 45 (Writ), tap the **"📄 View document"** button in the complaint card and click **"Download Signed PDF Document"**.
5. **Verify Resolution:** Advance to "Resolved" and test the feedback loop to confirm or reject the resolution.
