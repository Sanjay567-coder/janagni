"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  parseVoiceTranscript, 
  createComplaintAction, 
  updateComplaintStageAction, 
  resetComplaintAction,
  generateDocumentDraft,
  resetDemoAction
} from "@/app/actions";
import { Complaint } from "@/lib/db";
import { Mic, ArrowRight, RefreshCw, X, FileText, PlusCircle, CheckCircle } from "lucide-react";
import { jsPDF } from "jspdf";

interface DashboardClientProps {
  initialComplaint: Complaint | null;
  complaintsCount: number;
}

export default function DashboardClient({ initialComplaint, complaintsCount }: DashboardClientProps) {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ta">("en");
  
  // Complaint State
  const [complaint, setComplaint] = useState<Complaint | null>(initialComplaint);
  const [showIntake, setShowIntake] = useState<boolean>(!initialComplaint);

  // Voice Intake State
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

  // Audio References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load language preference
  useEffect(() => {
    const saved = localStorage.getItem("janagni_lang");
    if (saved === "ta" || saved === "en") {
      setLang(saved);
    } else {
      router.push("/onboarding");
    }
  }, [router]);

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
      severity: finalSeverity
    });

    setIsProcessingIntake(false);
    setShowTranscriptBox(false);
    setTranscript("");
    router.push(`/?id=${newId}`);
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

    // Header Metadata
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(138, 90, 46);
    doc.text(documentData.eyebrow, 20, 20);

    // Document Title
    doc.setFontSize(15);
    doc.setTextColor(28, 28, 28);
    doc.text(documentData.title, 20, 30);

    // Decorative Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(216, 211, 196);
    doc.line(20, 35, 190, 35);

    // Clean body HTML tags
    const cleanBody = documentData.body
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "\n\n")
      .replace(/<strong>/g, "")
      .replace(/<\/strong>/g, "")
      .replace(/<em>/g, "")
      .replace(/<\/em>/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(42, 42, 42);

    const splitText = doc.splitTextToSize(cleanBody, 170);
    doc.text(splitText, 20, 45);

    // Citations Footer
    doc.line(20, 255, 190, 255);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 100);
    const splitCite = doc.splitTextToSize(documentData.cite, 170);
    doc.text(splitCite, 20, 260);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Citizen Signature: Digitally Authorized via JanAgni", 20, 275);

    doc.save(`${documentData.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.pdf`);
  };

  // Demo Time Advance State Machine
  const handleAdvanceTime = async () => {
    if (!complaint) return;
    const stages: Complaint["stage"][] = ["filed", "internal_alert", "rti_triggered", "escalated", "resolved"];
    const currentIdx = stages.indexOf(complaint.stage);
    if (currentIdx < stages.length - 1) {
      const nextStage = stages[currentIdx + 1];
      const daysElapsedMap = [0, 30, 37, 45, 46];
      const nextDays = daysElapsedMap[currentIdx + 1];
      
      // Optimistic local state update for instant UI transition
      setComplaint({
        ...complaint,
        stage: nextStage,
        daysElapsed: nextDays
      });

      await updateComplaintStageAction(complaint.complaintId, nextStage, nextDays);
      router.refresh();
    }
  };

  const handleResetComplaint = async () => {
    if (!complaint) return;
    const now = new Date();
    
    // Optimistic local state update for instant UI transition
    setComplaint({
      ...complaint,
      stage: "filed",
      createdAt: now.toISOString(),
      slaDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysElapsed: 0
    });

    await resetComplaintAction(complaint.complaintId);
    router.refresh();
  };

  const handleResetDemoDb = async () => {
    setComplaint(null);
    setShowIntake(true);
    await resetDemoAction();
    router.push("/");
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

  const activeColor = complaint ? ringColors[complaint.stage] : "#5B8AA6";

  return (
    <div className="flex flex-col flex-1">
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
          <div className="font-fraunces text-[21px] font-semibold tracking-wide">JanAgni</div>
          <div className="text-[10px] text-text-500 tracking-wider uppercase font-sans">
            {lang === "en" ? "Civic escalation, automated" : <span className="font-tamil">தானியங்கி குறைதீர் தளம்</span>}
          </div>
        </div>
      </div>

      {/* 1. INTAKE UI */}
      {showIntake ? (
        <div className="animate-fade-in flex flex-col flex-1">
          <h1 className="font-fraunces text-[28px] sm:text-[32px] font-semibold leading-[1.2] mb-3">
            {lang === "en" ? (
              <>Report it once.<br />Let the <em className="text-ember-500 not-italic">fire</em> stay on it.</>
            ) : (
              <span className="font-tamil leading-tight">
                ஒரு முறை புகாரளிக்கவும்.<br />தொடர் <em className="text-ember-500 not-italic">அக்னியை</em> வையுங்கள்.
              </span>
            )}
          </h1>
          <p className="text-text-300 text-[14px] sm:text-[15px] leading-relaxed mb-8 max-w-[38ch]">
            {lang === "en" ? (
              "Speak or type your complaint. JanAgni tracks statutory deadlines and escalates automatically if authorities fail to act."
            ) : (
              <span className="font-tamil">
                உங்கள் புகாரை தமிழ் அல்லது ஆங்கிலத்தில் கூறலாம். அதிகாரிகள் நடவடிக்கை எடுக்கத் தவறினால் ஜனஅக்னி சட்டப்படி வழக்கை நகர்த்தும்.
              </span>
            )}
          </p>

          {/* Voice Mic Button */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={handleMicClick}
              disabled={isProcessingIntake}
              className={`w-[88px] height-[88px] h-[88px] rounded-full flex items-center justify-center bg-gradient-to-br from-ember-500 to-ember-600 transition-transform ${
                isRecording ? "animate-pulse-glow" : "hover:scale-[1.04]"
              } focus:outline-none focus:ring-2 focus:ring-text-100 focus:ring-offset-4 focus:ring-offset-ink-900`}
              aria-label="Tap to speak complaint"
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
                {lang === "en" ? "Review & Edit Complaint" : <span className="font-tamil">புகார் விவரங்களை சரிபார்க்கவும்</span>}
              </div>
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  if (!showTranscriptBox) setShowTranscriptBox(true);
                }}
                className="w-full bg-transparent border-none text-text-100 font-sans text-[14.5px] leading-relaxed resize-y min-h-[80px] p-0 focus:outline-none focus:ring-0"
                placeholder={lang === "en" ? "Enter complaint text..." : "புகாரை தட்டச்சு செய்யவும்..."}
              />
              
              <div className="flex flex-wrap gap-2 mt-3.5">
                <span className="text-[12px] px-3 py-1 rounded-full bg-ink-700 border border-border text-calm-300 font-mono">
                  {chips.category}
                </span>
                <span className="text-[12px] px-3 py-1 rounded-full bg-ink-700 border border-border text-text-300 font-mono">
                  {chips.wardDetails}
                </span>
                <span className="text-[12px] px-3 py-1 rounded-full bg-ink-700 border border-border text-text-300 font-mono">
                  Severity: {chips.severity}
                </span>
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
              className="text-center text-text-500 hover:text-text-300 text-xs mb-8 underline font-mono"
            >
              {lang === "en" ? "Or type complaint details manually" : "அல்லது புகாரை நேரடியாக தட்டச்சு செய்ய"}
            </button>
          )}

          {/* Submit Button */}
          {showTranscriptBox && (
            <button
              onClick={handleFileComplaint}
              disabled={isProcessingIntake}
              className="w-full py-4 rounded-full bg-text-100 text-ink-900 font-semibold text-[14.5px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {isProcessingIntake ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {lang === "en" ? "Processing..." : "செயலாக்குகிறது..."}
                </>
              ) : (
                <>
                  {lang === "en" ? "File this complaint" : <span className="font-tamil font-bold">புகாரை பதிவு செய்க</span>}
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          )}

          {complaintsCount > 0 && (
            <button
              onClick={() => setShowIntake(false)}
              className="mt-6 text-center text-xs text-calm-300 hover:underline font-mono"
            >
              ← Back to Active Grievance
            </button>
          )}
        </div>
      ) : (
        /* 2. Grievance Status Dashboard */
        <div className="animate-fade-in flex flex-col flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs uppercase tracking-widest text-text-500 font-mono">Active Complaint</h2>
            <button
              onClick={() => setShowIntake(true)}
              className="text-xs text-ember-500 hover:text-ember-600 font-medium flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              {lang === "en" ? "Report New" : <span className="font-tamil">புதிய புகார்</span>}
            </button>
          </div>

          {complaint && (
            <div className="bg-ink-800 border border-border rounded-custom p-5.5 mb-6 relative">
              {/* Card Top */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="font-mono text-[12.5px] text-text-500">{complaint.complaintId}</div>
                  <h3 className="font-fraunces text-[18px] sm:text-[19px] font-semibold text-text-100 mt-1 leading-snug">
                    {complaint.category}
                  </h3>
                  <div className="text-[13px] text-text-300 mt-1">{complaint.wardDetails}</div>
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
                    <div className="text-[8.5px] text-text-500 uppercase tracking-wider mt-1 font-sans">
                      {lang === "en" ? "Days Left" : <span className="font-tamil">நாட்கள்</span>}
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
                      {/* Connection Line */}
                      {index < stagesList.length - 1 && (
                        <div 
                          className={`absolute top-[15px] left-[calc(50%+15px)] w-[calc(100%-30px)] h-[2px] z-0 transition-colors ${
                            isReached && currentStageIndex > index 
                              ? "bg-gradient-to-r from-ember-500 to-ember-600" 
                              : "bg-ink-600"
                          }`}
                        />
                      )}

                      {/* Flame SVGs */}
                      <svg
                        className={`w-7.5 h-7.5 z-10 transition-all duration-500 ${
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

                      {/* Step Text Label */}
                      <div className="text-[10px] text-text-500 text-center mt-2 max-w-[66px] leading-tight font-sans transition-colors">
                        {lang === "en" ? st.label : <span className="font-tamil">{st.labelTa}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Explanation Box */}
              <div className="bg-ink-700 border border-border rounded-lg p-3 text-[13px] text-text-300 leading-relaxed mt-4 font-sans">
                <span 
                  dangerouslySetInnerHTML={{ 
                    __html: lang === "en" 
                      ? statusNotes[complaint.stage].en 
                      : statusNotes[complaint.stage].ta 
                  }} 
                />
              </div>

              {/* View Generated Document Button (Stage >= 2 / RTI) */}
              {(complaint.stage === "rti_triggered" || complaint.stage === "escalated") && (
                <button
                  onClick={handleOpenDocModal}
                  disabled={isGeneratingDoc}
                  className="mt-4.5 w-full py-2.5 rounded-full border border-border text-[13px] font-semibold text-text-100 flex items-center justify-center gap-1.5 hover:bg-ink-700 transition-colors"
                >
                  {isGeneratingDoc ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  {complaint.stage === "rti_triggered" 
                    ? "📄 View RTI application" 
                    : "📄 View writ petition"
                  }
                </button>
              )}

              {/* Verification Button for Resolved Stage */}
              {complaint.stage === "resolved" && (
                <button
                  onClick={() => router.push(`/resolution/${complaint.complaintId}`)}
                  className="mt-4.5 w-full py-3 rounded-full bg-sage-500 text-ink-900 font-bold text-[13.5px] flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <CheckCircle className="w-4 h-4" />
                  {lang === "en" ? "Verify Fix & Give Feedback" : <span className="font-tamil">தீர்வினை சரிபார்</span>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Demo Dock Panel */}
      {!showIntake && complaint && (
        <div className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-ink-800/95 backdrop-blur border border-border rounded-full py-1.5 pl-4 pr-1.5 flex items-center gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-40 max-w-[calc(100vw-32px)]">
          <span className="text-[10px] text-text-500 uppercase tracking-widest font-mono">Demo Control</span>
          <button
            onClick={handleAdvanceTime}
            disabled={complaint.stage === "resolved"}
            className="font-mono text-[11px] px-3 py-1.5 bg-ember-500 text-ink-900 font-bold rounded-full disabled:bg-ink-600 disabled:text-text-500 transition-colors hover:bg-ember-600"
          >
            {complaint.stage === "resolved" ? "Resolved" : "Advance time →"}
          </button>
          <button
            onClick={handleResetComplaint}
            className="text-[11px] px-3 py-1.5 border border-border text-text-300 font-mono rounded-full hover:bg-ink-700 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleResetDemoDb}
            className="text-[10px] px-2 py-1 text-text-500 hover:text-text-300 font-mono transition-colors"
            title="Clean Database"
          >
            Clear DB
          </button>
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
            >
              Download Signed PDF Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
