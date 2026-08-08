"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  parseVoiceTranscript, 
  createComplaintAction, 
  updateComplaintStageAction, 
  resetComplaintAction,
  generateDocumentDraft,
  resetDemoAction,
  seedDemoAction
} from "@/app/actions";
import { Complaint } from "@/lib/db";
import { useLanguage } from "@/components/LanguageContext";
import { Mic, ArrowRight, RefreshCw, X, FileText, PlusCircle, CheckCircle, AlertTriangle, AlertOctagon, ShieldAlert } from "lucide-react";
import { jsPDF } from "jspdf";

interface DashboardClientProps {
  initialComplaint: Complaint | null;
  complaintsCount: number;
}

export default function DashboardClient({ initialComplaint, complaintsCount }: DashboardClientProps) {
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };
  
  // Complaint State
  const [complaint, setComplaint] = useState<Complaint | null>(initialComplaint);
  const [showIntake, setShowIntake] = useState<boolean>(!initialComplaint);

  // Voice Intake State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLabel, setRecordingLabel] = useState("");
  const [showTranscriptBox, setShowTranscriptBox] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [chips, setChips] = useState({
    category: "Sanitation & Drainage",
    wardDetails: "Ward 172 · Velachery, Chennai",
    severity: "High"
  });
  const [isProcessingIntake, setIsProcessingIntake] = useState(false);

  // Document Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [documentData, setDocumentData] = useState<{
    eyebrow: string;
    title: string;
    body: string;
    cite: string;
  } | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  // Media Attachment States
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedMediaType, setAttachedMediaType] = useState<"image" | "video" | null>(null);

  const handleIntakeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedMediaUrl(reader.result as string);
      setAttachedMediaType(file.type.startsWith("image/") ? "image" : "video");
    };
    reader.readAsDataURL(file);
  };

  // Audio References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load language preference
  useEffect(() => {
    const saved = localStorage.getItem("janagni_lang");
    if (!saved) {
      router.push("/onboarding");
    }
  }, [router]);

  // Screen reader stage changes announcement
  useEffect(() => {
    if (complaint) {
      const stageText = 
        complaint.stage === "filed" ? "Filed" :
        complaint.stage === "internal_alert" ? "Supervisory Nudge Active" :
        complaint.stage === "rti_triggered" ? "RTI Application Drafted" :
        complaint.stage === "escalated" ? "Escalated to Writ Petition" :
        "Complaint Resolved";
      setLiveAnnouncement(`Complaint status updated to: ${stageText}`);
    }
  }, [complaint]);

  // Synchronize component state with prop updates (e.g. from Server Action revalidations)
  useEffect(() => {
    setComplaint(initialComplaint);
    if (initialComplaint) {
      setShowIntake(false);
    } else {
      setShowIntake(true);
    }
  }, [initialComplaint]);

  // Set default mic label based on language
  useEffect(() => {
    if (!recordingLabel) {
      setRecordingLabel(
        lang === "en" ? "Tap to speak your complaint" : "உங்கள் புகாரை கூற தட்டவும்"
      );
    }
  }, [lang, recordingLabel]);

  // MediaRecorder API Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            setErrorMessage(null);
            const base64Data = reader.result as string;
            const base64Clean = base64Data.split(",")[1];

            setIsProcessingIntake(true);
            setRecordingLabel(lang === "en" ? "Analyzing audio..." : "ஆடியோவை பகுப்பாய்வு செய்கிறது...");

            const result = await parseVoiceTranscript({ audioBase64: base64Clean });
            setTranscript(result.transcript);
            setChips({
              category: result.category,
              wardDetails: result.location,
              severity: result.severity
            });

            setIsProcessingIntake(false);
            setRecordingLabel(lang === "en" ? "Got it — review below" : "விவரங்கள் பெறப்பட்டன - சரிபார்க்கவும்");
            setShowTranscriptBox(true);
          } catch (e: unknown) {
            const err = e as Error;
            console.error("Failed to parse voice transcript:", err);
            setIsProcessingIntake(false);
            setRecordingLabel(lang === "en" ? "Failed to analyze. Please type below." : "பகுப்பாய்வு தோல்வி. தட்டச்சு செய்க.");
            setShowTranscriptBox(true);
            setErrorMessage(err.message || String(err));
          }
        };
      };

      recorder.start();
      setIsRecording(true);
      setRecordingLabel(lang === "en" ? "Listening..." : "கேட்கிறது...");
    } catch (err) {
      console.error("Recording start failed:", err);
      setShowTranscriptBox(true);
      setRecordingLabel(
        lang === "en" 
          ? "Mic unavailable. Type complaint directly." 
          : "மைக் வேலை செய்யவில்லை. நேரடியாக தட்டச்சு செய்யவும்."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Submit Text/Intake Complaint
  const handleFileComplaint = async () => {
    try {
      setErrorMessage(null);
      setIsProcessingIntake(true);
      let finalTranscript = transcript;
      let finalCategory = chips.category;
      let finalWard = chips.wardDetails;
      let finalSeverity = chips.severity;

      // If the user modified the text, re-parse to clean it up and find proper chips
      if (transcript.trim().length > 0) {
        const parsed = await parseVoiceTranscript({ text: transcript });
        finalTranscript = parsed.transcript;
        finalCategory = parsed.category;
        finalWard = parsed.location;
        finalSeverity = parsed.severity;
      }

      const newId = await createComplaintAction({
        transcript: finalTranscript,
        category: finalCategory,
        wardDetails: finalWard,
        severity: finalSeverity,
        attachedMediaUrl: attachedMediaUrl || undefined,
        attachedMediaType: attachedMediaType || undefined
      });

      setIsProcessingIntake(false);
      setShowTranscriptBox(false);
      setTranscript("");
      setAttachedMediaUrl(null);
      setAttachedMediaType(null);
      router.push(`/?id=${newId}`);
    } catch (e: unknown) {
      const err = e as Error;
      console.error("Failed to file complaint:", err);
      setIsProcessingIntake(false);
      setErrorMessage(err.message || String(err));
    }
  };

  // Document Draft Fetching
  const handleOpenDocModal = async () => {
    if (!complaint) return;
    setIsGeneratingDoc(true);
    const docData = await generateDocumentDraft(complaint.complaintId);
    setDocumentData(docData);
    setIsGeneratingDoc(false);
    setShowDocModal(true);
  };

  // PDF Compilation & Download using jsPDF
  const downloadPdf = () => {
    if (!documentData) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // 1. Header / Letterhead
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(138, 90, 46); // Ember theme color
    doc.text("JANAGNI CIVIC COMPLIANCE RECORD", pageWidth / 2, 16, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Statutory Document generated via JanAgni Civic Portal under G.O. (Ms) No. 99", pageWidth / 2, 21, { align: "center" });

    // Header Divider
    doc.setLineWidth(0.4);
    doc.setDrawColor(216, 211, 196);
    doc.line(margin, 24, pageWidth - margin, 24);

    // 2. Document Title
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(28, 28, 28);
    const splitTitle = doc.splitTextToSize(documentData.title.toUpperCase(), contentWidth);
    doc.text(splitTitle, pageWidth / 2, 33, { align: "center" });

    // Subheader / Reference Metas
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Reference ID: ${complaint?.complaintId || "GCC-AUDIT"}`, margin, 45);
    doc.text(`Date of Action: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - margin, 45, { align: "right" });

    // Content Divider
    doc.setLineWidth(0.15);
    doc.line(margin, 48, pageWidth - margin, 48);

    // 3. Document Body content
    const cleanBody = documentData.body
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "\n\n")
      .replace(/<strong>/g, "")
      .replace(/<\/strong>/g, "")
      .replace(/<em>/g, "")
      .replace(/<\/em>/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(42, 42, 42);

    const splitText = doc.splitTextToSize(cleanBody, contentWidth);
    let yPos = 56;

    splitText.forEach((line: string) => {
      // Avoid page overflow by checking bottom margin bounds
      if (yPos > pageHeight - margin - 35) {
        doc.addPage();
        // Repeating Header for subsequent pages
        doc.setFont("times", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(138, 90, 46);
        doc.text("JANAGNI CIVIC COMPLIANCE RECORD", pageWidth / 2, 16, { align: "center" });
        doc.setDrawColor(216, 211, 196);
        doc.line(margin, 18, pageWidth - margin, 18);
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(42, 42, 42);
        yPos = 26;
      }
      doc.text(line, margin, yPos);
      yPos += 6.5;
    });

    // 4. Citation Footer Section
    yPos += 8;
    if (yPos > pageHeight - margin - 30) {
      doc.addPage();
      yPos = 26;
    }

    doc.setLineWidth(0.2);
    doc.setDrawColor(216, 211, 196);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(28, 28, 28);
    doc.text("STATUTORY CITATION & AUTHORITY JUDGMENT:", margin, yPos);
    yPos += 5.5;

    doc.setFont("times", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    const splitCite = doc.splitTextToSize(documentData.cite, contentWidth);
    splitCite.forEach((line: string) => {
      if (yPos > pageHeight - margin - 12) {
        doc.addPage();
        yPos = 26;
      }
      doc.text(line, margin, yPos);
      yPos += 4.5;
    });

    // Signature Area
    yPos += 8;
    if (yPos > pageHeight - margin) {
      doc.addPage();
      yPos = 26;
    }
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Citizen Signature: Digitally Authorized via JanAgni", margin, yPos);

    doc.save(`JanAgni_${complaint?.complaintId || "escalation"}.pdf`);
    showToast("Document downloaded as PDF!", "success");
  };

  // Demo Time Advance State Machine (Sequential)
  const handleAdvanceTime = async () => {
    if (!complaint) return;
    const stages: Complaint["stage"][] = ["filed", "internal_alert", "rti_triggered", "escalated", "resolved"];
    const currentIdx = stages.indexOf(complaint.stage);
    if (currentIdx < stages.length - 1) {
      const nextStage = stages[currentIdx + 1];
      const daysElapsedMap = [0, 30, 37, 45, 46];
      const nextDays = daysElapsedMap[currentIdx + 1];
      
      setComplaint({
        ...complaint,
        stage: nextStage,
        daysElapsed: nextDays
      });

      await updateComplaintStageAction(complaint.complaintId, nextStage, nextDays);
      showToast(`Time advanced to ${nextStage.toUpperCase()}!`, "info");
      router.refresh();
    }
  };

  // Direct Jump to any stage
  const handleJumpToStage = async (newStage: Complaint["stage"]) => {
    if (!complaint) return;
    const daysElapsedMap: Record<Complaint["stage"], number> = {
      filed: 0,
      internal_alert: 30,
      rti_triggered: 37,
      escalated: 45,
      resolved: 46
    };
    const nextDays = daysElapsedMap[newStage];
    
    setComplaint({
      ...complaint,
      stage: newStage,
      daysElapsed: nextDays
    });

    await updateComplaintStageAction(complaint.complaintId, newStage, nextDays);
    showToast(`Time jumped to stage: ${newStage.toUpperCase()}`, "info");
    router.refresh();
  };

  const handleResetComplaint = async () => {
    if (!complaint) return;
    const now = new Date();
    
    setComplaint({
      ...complaint,
      stage: "filed",
      createdAt: now.toISOString(),
      slaDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysElapsed: 0
    });

    await resetComplaintAction(complaint.complaintId);
    showToast("Demo environment reset!", "info");
    router.refresh();
  };

  const handleResetDemoDb = async () => {
    setComplaint(null);
    setShowIntake(true);
    await resetDemoAction();
    router.push("/");
    router.refresh();
  };

  const handleSeedDemoDb = async () => {
    showToast("Seeding demo database...", "info");
    await seedDemoAction();
    showToast("Demo database seeded!", "success");
    router.refresh();
  };

  // Stepper UI Calculations
  const stagesList: { key: Complaint["stage"]; label: string; labelTa: string }[] = [
    { key: "filed", label: "Filed", labelTa: "தாக்கல் செய்யப்பட்டது" },
    { key: "internal_alert", label: "Supervisory nudge", labelTa: "உள் எச்சரிக்கை" },
    { key: "rti_triggered", label: "RTI drafted", labelTa: "RTI வரைவு" },
    { key: "escalated", label: "Writ escalated", labelTa: "நீதிமன்ற மனு" }
  ];

  const currentStageIndex = complaint ? ["filed", "internal_alert", "rti_triggered", "escalated", "resolved"].indexOf(complaint.stage) : 0;
  
  // SLA Circle Ring Math
  const ringCircumference = 276.5;
  const maxSlaDays = 30;
  const daysElapsed = complaint?.daysElapsed || 0;
  const daysLeft = Math.max(maxSlaDays - daysElapsed, 0);
  const ringFrac = complaint?.stage === "filed" ? daysLeft / maxSlaDays : 0;
  const strokeDashoffset = ringCircumference * (1 - ringFrac);

  const ringColors = {
    filed: "#5B8AA6",
    internal_alert: "#F5A623",
    rti_triggered: "#E4572E",
    escalated: "#E4572E",
    resolved: "#7FA687"
  };

  const statusNotes = {
    filed: {
      en: "<strong>Filed today.</strong> Under G.O. (Ms) No. 99 (21.09.2015), the ward officer must acknowledge within 3 days and resolve within 30.",
      ta: "<strong>இன்று தாக்கல் செய்யப்பட்டது.</strong> அரசாணை (வகை) எண் 99-இன் கீழ் (21.09.2015), வார்டு அதிகாரி 3 நாட்களுக்குள் ஒப்புக்கொண்டு 30 நாட்களுக்குள் தீர்க்க வேண்டும்."
    },
    internal_alert: {
      en: "<strong>Day 30 — no response.</strong> Statutory deadline missed. An internal alert has gone to the Zonal Commissioner's grievance register — a 7-day grace window before public escalation.",
      ta: "<strong>நாள் 30 — எந்த பதிலும் இல்லை.</strong> சட்டப்பூர்வ காலக்கெடு முடிந்தது. மண்டல ஆணையரின் குறைதீர் பதிவேட்டிற்கு ஒரு உள் எச்சரிக்கை அனுப்பப்பட்டுள்ளது."
    },
    rti_triggered: {
      en: "<strong>Day 37 — still unresolved.</strong> JanAgni has auto-drafted a Section 6(1) RTI application to the Public Information Officer. Ready for your review and signature.",
      ta: "<strong>நாள் 37 — இன்னும் தீர்க்கப்படவில்லை.</strong> ஜனஅக்னி பொது தகவல் அதிகாரிக்கு ஒரு பிரிவு 6(1) RTI விண்ணப்பத்தை தயாரித்துள்ளது."
    },
    escalated: {
      en: "<strong>Day 45+ — persistent inaction.</strong> An Article 226 High Court writ petition draft has been generated, citing Mumoorthy v. District Collector (Madras HC, June 2025).",
      ta: "<strong>நாள் 45+ — தொடர் நடவடிக்கை இன்மை.</strong> சென்னை உயர்நீதிமன்ற தீர்ப்பை மேற்கோள் காட்டி, பிரிவு 226 இன் கீழ் ஒரு நீதிமன்ற மனு தயாரிக்கப்பட்டுள்ளது."
    },
    resolved: {
      en: "<strong>Grievance Resolved.</strong> The authority marked this complaint as resolved. Please verify if the fix has been implemented successfully.",
      ta: "<strong>குறை தீர்க்கப்பட்டது.</strong> இந்த புகார் தீர்க்கப்பட்டதாக வார்டு அதிகாரி தெரிவித்துள்ளார். தயவுசெய்து சரிபார்க்கவும்."
    }
  };

  const getTranslatedCategory = (category: string) => {
    if (lang === "ta") {
      switch (category) {
        case "Sanitation & Drainage": return "சுகாதாரம் மற்றும் வடிகால்";
        case "Roads & Potholes": return "சாலைகள் மற்றும் பள்ளங்கள்";
        case "Streetlights": return "தெருவிளக்குகள்";
        case "Garbage Disposal": return "குப்பை அகற்றுதல்";
        case "Public Safety": return "பொது பாதுகாப்பு";
        default: return category;
      }
    }
    return category;
  };

  const getTranslatedLocation = (location: string) => {
    if (lang === "ta") {
      return location
        .replace("Ward", "வார்டு")
        .replace("Velachery", "வேளச்சேரி")
        .replace("Adyar", "அடையாறு")
        .replace("Thiruvanmiyur", "திருவான்மியூர்")
        .replace("Besant Nagar", "பெசன்ட் நகர்")
        .replace("Kotturpuram", "கோட்டூர்புரம்")
        .replace("Guindy", "கிண்டி")
        .replace("Chennai", "சென்னை");
    }
    return location;
  };

  const activeColor = complaint ? ringColors[complaint.stage] : "#5B8AA6";

  return (
    <div className={`flex flex-col flex-1 ${lang === "ta" ? "font-tamil" : ""}`}>
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-ink-800 border border-border px-4 py-2.5 rounded-full text-xs font-mono text-text-100 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-fade-in">
          <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-sage-500 shadow-[0_0_8px_rgba(127,166,135,0.6)]" : "bg-ember-500 shadow-[0_0_8px_rgba(245,166,35,0.6)]"}`} />
          {toast.message}
        </div>
      )}

      {/* Screen Reader Live Announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>

      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-7">
        <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 7 7.5 7 12.5C7 16 9.5 19 12 19C14.5 19 17 16 17 12.5C17 10.8 16.2 9.5 15.3 8.3C15.6 10 15 11 14 11.5C14.3 9.5 13.5 7 12 2Z" fill="url(#headerG)" />
          <path d="M10.5 13C10.5 15 11.2 16.5 12 16.5C12.8 16.5 13.5 15 13.5 13C13.5 11.8 12.9 11 12 10C11.6 11.3 11 12 10.5 13Z" fill="#0F1218" opacity="0.55" />
          <defs>
            <linearGradient id="headerG" x1="7" y1="2" x2="17" y2="19">
              <stop stopColor="#F5A623" />
              <stop offset="1" stopColor="#E4572E" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <div className={`text-[21px] font-semibold tracking-wide ${lang === "ta" ? "font-bold font-tamil" : "font-fraunces"}`}>
            {t("brandTitle")}
          </div>
          <div className="text-[10px] text-text-500 tracking-wider uppercase font-sans">
            {t("brandSub")}
          </div>
        </div>
      </div>

      {/* 1. INTAKE UI */}
      {showIntake ? (
        <div className="animate-fade-in flex flex-col flex-1">
          <h1 className={`text-[28px] sm:text-[32px] font-semibold leading-[1.2] mb-3 ${lang === "ta" ? "font-bold font-tamil" : "font-fraunces"}`}>
            {lang === "en" ? (
              <>Report it once.<br />Let the <em className="text-ember-500 not-italic">fire</em> stay on it.</>
            ) : (
              <span className="leading-tight">
                ஒரு முறை புகாரளிக்கவும்.<br />தொடர் <em className="text-ember-500 not-italic">அக்னியை</em> வையுங்கள்.
              </span>
            )}
          </h1>
          <p className="text-text-300 text-[14px] sm:text-[15px] leading-relaxed mb-8 max-w-[38ch] font-sans">
            {t("heroSub")}
          </p>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-custom p-4 mb-6 text-sm text-red-400 font-sans leading-relaxed animate-fade-in flex gap-3 items-start shadow-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-100 font-semibold block mb-0.5 font-sans">Configuration Error Registered</strong>
                <span className="font-mono text-xs block break-words max-w-[300px]">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Voice Mic Button */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={handleMicClick}
              disabled={isProcessingIntake}
              className={`w-[88px] height-[88px] h-[88px] rounded-full flex items-center justify-center bg-gradient-to-br from-ember-500 to-ember-600 transition-transform ${
                isRecording ? "animate-pulse-glow" : "hover:scale-[1.04]"
              } focus:outline-none focus:ring-2 focus:ring-text-100 focus:ring-offset-4 focus:ring-offset-ink-900 active:scale-[0.98]`}
              aria-label={recordingLabel}
            >
              <Mic className="w-7 h-7 text-ink-900" />
            </button>
            <div className="mt-3.5 text-[13.5px] text-text-300 font-sans">
              {recordingLabel}
            </div>
          </div>

          {/* Transcript Box & Editing fallback */}
          {(showTranscriptBox || transcript.length > 0) && (
            <div className="bg-ink-800 border border-border rounded-custom p-4 mb-4 animate-fade-in">
              <div className="text-[11px] text-text-500 uppercase tracking-widest mb-2 font-mono">
                {t("transcriptBoxTitle")}
              </div>
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  if (!showTranscriptBox) setShowTranscriptBox(true);
                }}
                className="w-full bg-transparent border-none text-text-100 font-sans text-[14.5px] leading-relaxed resize-y min-h-[80px] p-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
                placeholder={lang === "en" ? "Enter complaint text..." : "புகாரை தட்டச்சு செய்யவும்..."}
              />
              
              <div className="flex flex-wrap gap-2 mt-3.5">
                <span className="text-[12px] px-3 py-1 rounded-full bg-ink-700 border border-border text-calm-300 font-mono">
                  {getTranslatedCategory(chips.category)}
                </span>
                <span className="text-[12px] px-3 py-1 rounded-full bg-ink-700 border border-border text-text-300 font-mono">
                  {getTranslatedLocation(chips.wardDetails)}
                </span>
                <span className="text-[12px] px-3 py-1 rounded-full bg-ink-700 border border-border text-text-300 font-mono">
                  {lang === "ta" ? "தீவிரம்: " : "Severity: "}
                  {lang === "ta" ? (chips.severity === "High" ? "அதிதீவிரம்" : chips.severity === "Medium" ? "நடுத்தரம்" : "குறைவு") : chips.severity}
                </span>
              </div>

              {/* Media Attachment Selector */}
              <div className="mt-3.5 pt-3 border-t border-border/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-400 font-mono uppercase tracking-wider">
                    {lang === "ta" ? "ஊடக இணைப்பு (விருப்பத்தேர்வு):" : "Media Attachment (Optional):"}
                  </span>
                  {attachedMediaUrl && (
                    <button
                      onClick={() => {
                        setAttachedMediaUrl(null);
                        setAttachedMediaType(null);
                      }}
                      className="text-[9.5px] text-red-400 hover:text-red-300 font-mono uppercase underline"
                    >
                      {lang === "ta" ? "நீக்கு" : "Remove"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!attachedMediaUrl ? (
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-ink-700 border border-border rounded-lg text-xs font-semibold text-text-300 hover:text-text-100 cursor-pointer hover:border-text-500 transition-colors">
                      <PlusCircle className="w-4 h-4 text-ember-500" />
                      <span>{lang === "ta" ? "புகைப்படம் / வீடியோவை இணைக்கவும்" : "Attach Photo / Video"}</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleIntakeFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 w-full bg-ink-700/50 p-2 border border-border rounded-lg">
                      {attachedMediaType === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attachedMediaUrl} alt="Intake attachment" className="w-10 h-10 object-cover rounded-md border border-border" />
                      ) : (
                        <div className="w-10 h-10 bg-ink-900 border border-border rounded-md flex items-center justify-center">
                          <FileText className="w-5 h-5 text-ember-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-text-300 block truncate font-mono">
                          {attachedMediaType === "image" ? "Attached Photo" : "Attached Video"}
                        </span>
                        <span className="text-[9px] text-text-500 block">Ready to file</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fallback Type-in Trigger (if not already typing) */}
          {!showTranscriptBox && !isRecording && (
            <button
              onClick={() => {
                setShowTranscriptBox(true);
                setTranscript("Open sewage overflow near the bus stop, Ward 172, Velachery. It's been like this for three weeks and nobody's come to look at it.");
              }}
              className="text-center text-text-500 hover:text-text-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500 rounded px-2 py-1 text-xs mb-8 underline font-mono transition-colors"
              aria-label={t("typeFallbackLink")}
            >
              {t("typeFallbackLink")}
            </button>
          )}

          {/* Submit Button */}
          {showTranscriptBox && (
            <button
              onClick={handleFileComplaint}
              disabled={isProcessingIntake}
              className="w-full py-4 rounded-full bg-text-100 text-ink-900 font-bold text-[14.5px] flex items-center justify-center gap-2 hover:bg-text-300 hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 active:scale-[0.99]"
            >
              {isProcessingIntake ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t("fileBtnProcessing")}
                </>
              ) : (
                <>
                  <span>{t("fileBtnLabel")}</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          )}

          {complaintsCount > 0 && (
            <button
              onClick={() => setShowIntake(false)}
              className="mt-6 text-center text-xs text-calm-300 hover:text-calm-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-calm-500 rounded px-2 py-1 font-mono transition-colors"
            >
              {t("backToActiveGrievanceBtn")}
            </button>
          )}
        </div>
      ) : (
        /* 2. Grievance Status Dashboard */
        <div className="animate-fade-in flex flex-col flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs uppercase tracking-widest text-text-500 font-mono">{t("activeGrievanceTitle")}</h2>
            <button
              onClick={() => setShowIntake(true)}
              className="text-xs text-ember-500 hover:text-ember-600 font-medium flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500 rounded px-1.5 py-0.5 transition-colors"
              aria-label={t("reportNewGrievanceBtn")}
            >
              <PlusCircle className="w-4 h-4" />
              {t("reportNewGrievanceBtn")}
            </button>
          </div>

          {complaint && (
            <div className="bg-ink-800 border border-border rounded-custom p-5.5 mb-6 relative shadow-lg">
              {/* Card Top */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="font-mono text-[12.5px] text-text-500">{complaint.complaintId}</div>
                  <h3 className={`text-[18px] sm:text-[19px] font-semibold text-text-100 mt-1 leading-snug ${lang === "ta" ? "font-bold" : "font-fraunces"}`}>
                    {getTranslatedCategory(complaint.category)}
                  </h3>
                  <div className="text-[13px] text-text-300 mt-1 font-sans">
                    {getTranslatedLocation(complaint.wardDetails)}
                  </div>
                </div>

                {/* SLA Circular Ring Indicator */}
                <div className="relative w-[84px] h-[84px] sm:w-[94px] sm:h-[94px] flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 104 104">
                    <circle className="fill-none stroke-ink-600" strokeWidth="8" cx="52" cy="52" r="44" />
                    <circle
                      className="fill-none stroke-linecap-round transition-all duration-1000"
                      strokeWidth="8"
                      stroke={activeColor}
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={strokeDashoffset}
                      cx="52"
                      cy="52"
                      r="44"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-mono text-[20px] sm:text-[22px] font-semibold leading-none text-text-100">
                      {complaint.stage === "resolved" ? "0" : Math.max(maxSlaDays - daysElapsed, 0)}
                    </div>
                    <div className="text-[8.5px] text-text-500 uppercase tracking-wider mt-1 font-sans font-semibold">
                      {t("daysLeftLabel")}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Stage Stepper */}
              <div className="flex justify-between items-start mt-6 mb-5 relative">
                {stagesList.map((st, index) => {
                  const isReached = complaint.stage !== "resolved" && currentStageIndex >= index;
                  const isResolvedState = complaint.stage === "resolved";

                  return (
                    <div key={st.key} className="flex flex-col items-center flex-1 relative group">
                      {/* Icon container of exact size (30px height / full width) to vertically center line and icon */}
                      <div className="relative flex items-center justify-center h-[30px] w-full">
                        {/* Connection Line */}
                        {index < stagesList.length - 1 && (
                          <div 
                            className={`absolute left-[calc(50%+15px)] top-1/2 -translate-y-1/2 w-[calc(100%-30px)] h-[2px] z-0 transition-colors ${
                              isReached && currentStageIndex > index 
                                ? "bg-gradient-to-r from-ember-500 to-ember-600" 
                                : "bg-ink-600"
                            }`}
                          />
                        )}

                        {/* Flame SVGs */}
                        <svg
                          className={`w-[30px] h-[30px] z-10 transition-all duration-500 ${
                            isReached 
                              ? "opacity-100 text-ember-500 drop-shadow-[0_0_6px_var(--ember-glow)]" 
                              : isResolvedState 
                                ? "opacity-40 text-sage-500" 
                                : "opacity-30 text-ink-600"
                          }`}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C12 2 7 7.5 7 12.5C7 16 9.5 19 12 19C14.5 19 17 16 17 12.5C17 10.8 16.2 9.5 15.3 8.3C15.6 10 15 11 14 11.5C14.3 9.5 13.5 7 12 2Z" />
                        </svg>
                      </div>

                      {/* Step Text Label */}
                      <div className="text-[10px] text-text-500 text-center mt-2 max-w-[66px] leading-tight font-sans transition-colors">
                        {lang === "en" ? st.label : <span className="font-tamil">{st.labelTa}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Higher Official Alert notification warning for internal_alert grace window */}
              {complaint.stage === "internal_alert" && (
                <div className="mt-4 p-3 bg-ember-600/10 border border-ember-600/30 rounded-lg text-xs leading-relaxed text-ember-500 font-sans flex items-start gap-2 animate-pulse">
                  <AlertOctagon className="w-4 h-4 text-ember-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-text-100 font-mono text-[10px] uppercase tracking-wider font-bold">
                      {lang === "ta" ? "மண்டல உயர் அதிகாரி எச்சரிக்கை செயலில் உள்ளது" : "Zonal Commissioner Notification Dispatched"}
                    </strong>
                    <span className="text-[11.5px] text-text-300 block mt-0.5">
                      {lang === "ta" 
                        ? "அரசாணை 99 காலக்கெடு தவறியதால் ஆணையருக்கு எச்சரிக்கை அனுப்பப்பட்டது. 7 நாட்கள் சலுகை காலம் செயலில் உள்ளது." 
                        : "G.O. 99 breach registered. Zonal Commissioner has been notified. 7-day grace window active before auto-RTI trigger."}
                    </span>
                  </div>
                </div>
              )}

              {/* Status Explanation Box */}
              <div className="bg-ink-700 border border-border rounded-lg p-3 text-[13px] text-text-300 leading-relaxed mt-4 font-sans">
                {complaint.stage === "resolved" && complaint.isDeclined ? (
                  <span 
                    dangerouslySetInnerHTML={{ 
                      __html: lang === "en" 
                        ? "<strong>Grievance Declined.</strong> The authority rejected this complaint. Please inspect the declination note and reason provided below."
                        : "<strong>புகார் நிராகரிக்கப்பட்டது.</strong> இந்த புகாரை வார்டு அதிகாரி நிராகரித்துள்ளார். கீழே உள்ள நிராகரிப்பு காரணத்தை சரிபார்க்கவும்."
                    }} 
                  />
                ) : (
                  <span 
                    dangerouslySetInnerHTML={{ 
                      __html: lang === "en" 
                        ? statusNotes[complaint.stage].en 
                        : statusNotes[complaint.stage].ta 
                    }} 
                  />
                )}
              </div>

              {/* Attached Citizen Media */}
              {complaint.attachedMediaUrl && (
                <div className="mt-4 p-3 bg-ink-700/50 border border-border rounded-lg flex flex-col gap-2">
                  <div className="text-[10px] text-text-400 font-mono uppercase tracking-wider">
                    {lang === "ta" ? "இணைக்கப்பட்ட ஊடகம்:" : "Your Attached Media:"}
                  </div>
                  {complaint.attachedMediaType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={complaint.attachedMediaUrl} alt="Attached Proof" className="max-h-[140px] w-full object-cover rounded-lg border border-border" />
                  ) : (
                    <video src={complaint.attachedMediaUrl} controls className="max-h-[140px] w-full rounded-lg border border-border" />
                  )}
                </div>
              )}

              {/* Officer Resolution Notes / Excuses / Declination / Proof */}
              {(complaint.officerNote || complaint.officerProofUrl || complaint.isDeclined) && (
                <div className="mt-4 p-3.5 bg-ink-700/80 border border-border rounded-lg flex flex-col gap-2 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className={`w-4 h-4 ${complaint.isDeclined ? "text-ember-500" : "text-sage-500"}`} />
                    <span className="text-[10.5px] text-text-300 font-mono uppercase tracking-wider font-bold">
                      {complaint.isDeclined 
                        ? (lang === "ta" ? "அதிகாரி நிராகரிப்பு விளக்கம்:" : "Officer Declination Excuse:")
                        : (lang === "ta" ? "அதிகாரி தீர்வு அறிக்கை:" : "Officer Resolution Proof:")
                      }
                    </span>
                  </div>
                  {complaint.officerNote && (
                    <p className="text-xs text-text-200 leading-relaxed font-sans italic bg-ink-800/40 p-2 rounded border border-border/30">
                      &ldquo;{complaint.officerNote}&rdquo;
                    </p>
                  )}
                  {complaint.officerProofUrl && (
                    <div className="mt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={complaint.officerProofUrl} alt="Officer Resolution Proof" className="max-h-[140px] w-full object-cover rounded-lg border border-border" />
                    </div>
                  )}
                </div>
              )}

              {/* View Generated Document Button (Stage >= 2 / RTI) */}
              {(complaint.stage === "rti_triggered" || complaint.stage === "escalated") && (
                <button
                  onClick={handleOpenDocModal}
                  disabled={isGeneratingDoc}
                  className="mt-4.5 w-full py-2.5 rounded-full border border-border text-[13px] font-semibold text-text-100 flex items-center justify-center gap-1.5 hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 transition-colors"
                >
                  {isGeneratingDoc ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  {complaint.stage === "rti_triggered" 
                    ? t("viewDocRti") 
                    : t("viewDocWrit")
                  }
                </button>
              )}

              {/* Verification Button for Resolved Stage */}
              {complaint.stage === "resolved" && (
                <button
                  onClick={() => router.push(`/resolution/${complaint.complaintId}`)}
                  className={`mt-4.5 w-full py-3 rounded-full font-bold text-[13.5px] flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 active:scale-[0.99] ${
                    complaint.isDeclined
                      ? "bg-ember-600 text-text-100 hover:bg-ember-700 focus-visible:ring-ember-500 shadow-[0_4px_15px_rgba(228,87,46,0.25)]"
                      : "bg-sage-500 text-ink-900 hover:bg-sage-500/85 focus-visible:ring-sage-500 shadow-[0_4px_15px_rgba(127,166,135,0.25)]"
                  }`}
                >
                  {complaint.isDeclined ? (
                    <>
                      <AlertOctagon className="w-4.5 h-4.5 animate-pulse" />
                      {lang === "ta" ? "நிராகரிப்பை மறுபரிசீலனை செய்க" : "Review Declination & Appeal"}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {t("verifyResolutionBtn")}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Demo Control Dock Panel */}
      {!showIntake && complaint && (
        <div className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-ink-800/95 backdrop-blur border border-border rounded-2xl py-3 px-4 flex flex-col gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-40 w-[calc(100vw-32px)] max-w-[400px]">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] text-text-500 uppercase tracking-widest font-mono font-bold">
              {t("demoControlTitle")}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetComplaint}
                className="text-[10px] px-2.5 py-1 border border-border text-text-300 font-mono rounded-md hover:bg-ink-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500"
              >
                {t("demoControlReset")}
              </button>
              <button
                onClick={handleResetDemoDb}
                className="text-[10px] px-2.5 py-1 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 font-mono rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                title="Clean Database"
              >
                {t("demoControlClear")}
              </button>
              <button
                onClick={handleSeedDemoDb}
                className="text-[10px] px-2.5 py-1 bg-green-950/20 border border-green-900/30 text-green-400 hover:bg-green-900/30 font-mono rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500"
                title="Seed Database"
              >
                {lang === "ta" ? "விதைக்க" : "Seed"}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-0.5">
            <button
              onClick={handleAdvanceTime}
              disabled={complaint.stage === "resolved"}
              className="font-mono text-[11px] py-2 bg-ember-500 text-ink-900 font-bold rounded-lg disabled:bg-ink-600 disabled:text-text-500 transition-colors hover:bg-ember-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500"
            >
              {complaint.stage === "resolved" ? (lang === "ta" ? "முடிந்தது" : "Resolved") : t("demoControlAdvance")}
            </button>
            
            <select
              value={complaint.stage}
              onChange={(e) => handleJumpToStage(e.target.value as Complaint["stage"])}
              className="bg-ink-700 border border-border rounded-lg text-[11px] font-mono text-text-100 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-ember-500 cursor-pointer"
              aria-label="Directly jump to any timeline stage"
            >
              <option value="filed">Day 0: Filed</option>
              <option value="internal_alert">Day 30: Nudge</option>
              <option value="rti_triggered">Day 37: RTI</option>
              <option value="escalated">Day 45: Writ</option>
              <option value="resolved">Day 46: Resolved</option>
            </select>
          </div>
        </div>
      )}

      {/* Document Modal Overlay */}
      {showDocModal && documentData && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowDocModal(false)}
        >
          <div 
            className="w-full max-w-[460px] max-height-[85vh] bg-[#F4F1E9] text-[#1C1C1C] rounded-t-2xl sm:rounded-2xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setShowDocModal(false)}
              className="float-right text-2xl text-[#666] hover:text-[#222]"
              aria-label={lang === "en" ? "Close preview modal" : "ஆவணப் பார்வையாளரை மூடுக"}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Document Header */}
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#8A5A2E]">
              {documentData.eyebrow}
            </div>
            
            <h3 className="font-fraunces text-xl font-bold mt-1.5 mb-4 text-[#1C1C1C] leading-snug">
              {documentData.title}
            </h3>

            {/* Document Contents */}
            <div 
              className="text-[13.5px] leading-relaxed text-[#2A2A2A] font-sans pr-2"
              dangerouslySetInnerHTML={{ __html: documentData.body }}
            />

            {/* Citations Footer */}
            <div className="text-[11px] text-[#7A7A7A] mt-5 pt-3.5 border-t border-[#D8D3C4] leading-relaxed">
              {documentData.cite}
            </div>

            {/* Signature Area */}
            <div className="mt-5 border border-dashed border-[#999] rounded-lg p-3 text-center text-[#777] text-[12.5px]">
              Citizen signature — Authorized via JanAgni OTP
            </div>

            {/* PDF Generation Download */}
            <button
              onClick={downloadPdf}
              className="w-full mt-5 py-3 bg-[#8A5A2E] text-white font-bold rounded-lg text-[13.5px] hover:bg-[#6E4622] transition-colors"
              aria-label={lang === "en" ? "Download print-ready PDF" : "பி.டி.எஃப் ஆவணம் பதிவிறக்கு"}
            >
              Download Signed PDF Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
