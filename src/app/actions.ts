"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  getComplaintById, 
  saveComplaint, 
  updateComplaint, 
  resetComplaintToFiled,
  clearAllComplaints,
  Complaint 
} from "@/lib/db";
import { revalidatePath } from "next/cache";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper to run a promise with a timeout and fallback
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`Gemini API call timed out after ${timeoutMs}ms. Using fallback.`);
      resolve(fallback);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId!) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    console.error("Gemini API call failed, using fallback:", error);
    return fallback;
  }
}

// 1. Parse Voice/Text Intake
export async function parseVoiceTranscript(payload: { audioBase64?: string; text?: string }) {
  const fallbackResponse = {
    transcript: payload.text || "Open sewage overflow near the bus stop, Ward 172, Velachery. It's been like this for three weeks and nobody's come to look at it.",
    category: "Sanitation & Drainage",
    location: "Ward 172 · Velachery, Chennai",
    severity: "High"
  };

  if (!genAI) {
    console.log("No GEMINI_API_KEY found, using static fallback.");
    return fallbackResponse;
  }

  const promise = (async () => {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    let prompt = `You are a civic intake assistant. Analyze this user complaint and return a JSON structure with category, location, severity, and clean transcript.
Options for category: 'Sanitation & Drainage', 'Roads & Potholes', 'Streetlights', 'Garbage Disposal', 'Public Safety', 'Others'.
Options for severity: 'Low', 'Medium', 'High'.
Output format:
{
  "transcript": "string containing the clean text of the complaint",
  "category": "string",
  "location": "string with ward and area details",
  "severity": "string"
}`;

    const contents: (string | { inlineData: { data: string; mimeType: string } })[] = [];
    if (payload.audioBase64) {
      contents.push({
        inlineData: {
          data: payload.audioBase64,
          mimeType: "audio/webm"
        }
      });
      prompt += `\nTranscribe the audio and extract the details. Output English JSON.`;
    } else if (payload.text) {
      prompt += `\nClean up this text and extract details: "${payload.text}"`;
    } else {
      return fallbackResponse;
    }

    contents.push(prompt);

    const result = await model.generateContent(contents);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    
    return {
      transcript: parsed.transcript || fallbackResponse.transcript,
      category: parsed.category || fallbackResponse.category,
      location: parsed.location || fallbackResponse.location,
      severity: parsed.severity || fallbackResponse.severity,
    };
  })();

  return withTimeout(promise, 3000, fallbackResponse);
}

// 2. Document Generation (RTI or Writ)
export async function generateDocumentDraft(complaintId: string) {
  const complaint = await getComplaintById(complaintId);
  const stage = complaint?.stage || "filed";
  const id = complaintId;
  const category = complaint?.category || "Civic Complaint";
  const location = complaint?.wardDetails || "Velachery, Chennai";

  // Base fallback document content using template values
  const isRti = stage === "rti_triggered" || stage === "filed" || stage === "internal_alert";
  
  const fallbackDoc = isRti ? {
    eyebrow: "Section 6(1) · Right to Information Act, 2005",
    title: "RTI Application — Draft for Review",
    body: `<p><strong>To:</strong> The Public Information Officer, Greater Chennai Corporation, Zone 13</p>
<p><strong>Re:</strong> Complaint Ref. ${id}, filed under G.O. (Ms) No. 99, dated 21.09.2015, mandating resolution within 30 days.</p>
<p>I request certified copies of all file notings, inspection reports, and officer action taken in respect of the above complaint (${category}, ${location}), filed on record and unresolved as of this date, in breach of the statutory 30-day disposal timeline.</p>
<p>I further request the name and designation of the officer currently responsible for this file, and the reason, if any, recorded for the delay.</p>`,
    cite: "Cites: G.O. (Ms) No. 99, Personnel & Administrative Reforms (A) Dept., dated 21.09.2015 · Section 6(1), RTI Act 2005."
  } : {
    eyebrow: "Article 226 · Constitution of India",
    title: "High Court Writ Petition — Draft for Review",
    body: `<p><strong>In the matter of:</strong> Continued inaction on Complaint Ref. ${id} (${location}), filed and unresolved beyond the statutory period under G.O. (Ms) No. 99, dated 21.09.2015, and unresolved despite a Section 6(1) RTI application dated Day 37.</p>
<p>The petitioner seeks a direction to the respondent authorities to redress the grievance forthwith, consistent with the Madras High Court's findings in <em>Mumoorthy v. The District Collector</em> (W.P. Nos. 30013 et al. of 2024, decided 27.06.2025), regarding time-bound action on public representations.</p>`,
    cite: "Cites: Mumoorthy v. The District Collector, Madras HC, decided 27.06.2025 · G.O. (Ms) No. 99, dated 21.09.2015."
  };

  if (!genAI) {
    console.log("No GEMINI_API_KEY found, using local template replacement.");
    return fallbackDoc;
  }

  const promise = (async () => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a legal document assistant. draft a legal document for this civic complaint:
Complaint ID: ${id}
Category: ${category}
Location: ${location}
Current escalation stage: ${stage} (either 'rti_triggered' where we need a Section 6(1) RTI application, or 'escalated' where we need an Article 226 High Court writ petition).

Make sure to include and citation fill templates:
1. G.O. (Ms) No. 99 dated 21.09.2015 (about 30 days resolution)
2. Mumoorthy v. District Collector, Madras HC, 27.06.2025 (if escalated)

Format the output strictly as JSON:
{
  "eyebrow": "short legal header/act name",
  "title": "Document Title",
  "body": "HTML paragraphs detailing the text of the document",
  "cite": "Citations used"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Clean response text in case LLM wraps it in markdown code block
    const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      eyebrow: parsed.eyebrow || fallbackDoc.eyebrow,
      title: parsed.title || fallbackDoc.title,
      body: parsed.body || fallbackDoc.body,
      cite: parsed.cite || fallbackDoc.cite
    };
  })();

  return withTimeout(promise, 3000, fallbackDoc);
}

// 3. Create Complaint in DB
export async function createComplaintAction(formData: {
  transcript: string;
  category: string;
  wardDetails: string;
  severity: string;
}) {
  const newId = `GCC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();
  const sla = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const complaint: Complaint = {
    complaintId: newId,
    transcript: formData.transcript,
    category: formData.category,
    wardDetails: formData.wardDetails,
    severity: formData.severity,
    stage: "filed",
    createdAt: now.toISOString(),
    slaDeadline: sla.toISOString(),
    daysElapsed: 0,
  };

  await saveComplaint(complaint);
  revalidatePath("/");
  revalidatePath("/complaints");
  return newId;
}

// 4. Update Complaint Stage / Days
export async function updateComplaintStageAction(id: string, stage: Complaint["stage"], daysElapsed: number) {
  await updateComplaint(id, { stage, daysElapsed });
  revalidatePath("/");
  revalidatePath("/complaints");
}

// 5. Reset Single Complaint
export async function resetComplaintAction(id: string) {
  await resetComplaintToFiled(id);
  revalidatePath("/");
  revalidatePath("/complaints");
}

// 6. Reset/Seed Demo
export async function resetDemoAction() {
  await clearAllComplaints();
  revalidatePath("/");
  revalidatePath("/complaints");
}

// 7. Submit Resolution Feedback
export async function submitResolutionFeedbackAction(id: string, isFixed: boolean) {
  if (isFixed) {
    // Verified resolved
    await updateComplaint(id, { stage: "resolved" });
  } else {
    // Revert back to escalated (Writ petition active) at 45 days
    await updateComplaint(id, { stage: "escalated", daysElapsed: 45 });
  }
  revalidatePath("/");
  revalidatePath("/complaints");
}

