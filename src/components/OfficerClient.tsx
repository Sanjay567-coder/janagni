"use client";

import { AlertOctagon, CheckCircle2, X, FileText, CheckCircle, Image as ImageIcon, Video as VideoIcon, PlusCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Complaint } from "@/lib/db";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateComplaintStageAction } from "@/app/actions";
import { jsPDF } from "jspdf";

interface OfficerClientProps {
  complaints: Complaint[];
}

export default function OfficerClient({ complaints }: OfficerClientProps) {
  const { language, t } = useLanguage();
  const router = useRouter();
  
  // Dashboard states
  const [role, setRole] = useState<"ward" | "commissioner">("ward");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Officer review dialog inputs
  const [officerNote, setOfficerNote] = useState("");
  const [officerProofUrl, setOfficerProofUrl] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Compute live KPIs from the database complaints
  const activeComplaints = complaints.filter((c) => c.stage !== "resolved");
  const slaBreaches = complaints.filter((c) => c.daysElapsed >= 30 && c.stage !== "resolved");
  const activeRtis = complaints.filter((c) => c.stage === "rti_triggered");
  const resolvedComplaints = complaints.filter((c) => c.stage === "resolved");
  const commissionerAlerts = complaints.filter((c) => c.stage === "internal_alert");
  
  const avgResolutionTime = resolvedComplaints.length > 0
    ? (resolvedComplaints.reduce((sum, c) => sum + c.daysElapsed, 0) / resolvedComplaints.length).toFixed(1) + "d"
    : "14.2d";

  const getTranslatedCategory = (category: string) => {
    if (language === "ta") {
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
    if (language === "ta") {
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

  const getStageLabel = (stage: Complaint["stage"], isDeclined?: boolean) => {
    if (stage === "resolved") {
      return isDeclined 
        ? (language === "ta" ? "நிராகரிக்கப்பட்டது" : "Declined") 
        : (language === "ta" ? "தீர்க்கப்பட்டது" : "Resolved");
    }
    switch (stage) {
      case "filed": return language === "ta" ? "தாக்கல் செய்யப்பட்டது" : "Filed";
      case "internal_alert": return language === "ta" ? "மண்டல எச்சரிக்கை" : "Nudge Active";
      case "rti_triggered": return language === "ta" ? "RTI தயாரானது" : "RTI Drafted";
      case "escalated": return language === "ta" ? "நீதிமன்ற மனு" : "Writ Escalated";
    }
  };

  const getSlaStatusText = (c: Complaint) => {
    if (c.stage === "resolved") {
      return c.isDeclined 
        ? (language === "ta" ? "நிராகரிக்கப்பட்டது" : "Declined")
        : (language === "ta" ? "தீர்க்கப்பட்டது" : "Resolved");
    }
    if (c.daysElapsed === 0) {
      return language === "ta" ? "காலக்கெடுவிற்குள்" : "Within SLA";
    }
    if (c.daysElapsed >= 30) {
      const over = c.daysElapsed - 30;
      return language === "ta" ? `முடிந்தது +${over}நா` : `Lapsed +${over}d`;
    }
    return language === "ta" ? "SLA-விற்குள்" : "Within SLA";
  };

  const getSlaColorClass = (c: Complaint) => {
    if (c.stage === "resolved") {
      return c.isDeclined ? "text-red-500 font-semibold" : "text-sage-500";
    }
    if (c.daysElapsed >= 30) return "text-ember-600 font-semibold";
    if (c.daysElapsed >= 20) return "text-ember-500";
    return "text-calm-300";
  };

  const handleOfficerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setOfficerProofUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const downloadOfficerPdf = (c: Complaint) => {
    const isRti = c.stage === "rti_triggered";
    const docTitle = isRti ? "Section 6(1) RTI Application" : "High Court Writ Petition (Article 226)";
    
    const docPdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const margin = 20;
    let yPos = 30;

    docPdf.setFont("times", "bold");
    docPdf.setFontSize(14);
    docPdf.text("STATUTORY ESCALATION DOCUMENT", 105, yPos, { align: "center" });
    
    yPos += 6;
    docPdf.setFont("times", "normal");
    docPdf.setFontSize(10);
    docPdf.text(`REF ID: ${c.complaintId} | ESCALATED ON DAY: ${c.daysElapsed}`, 105, yPos, { align: "center" });

    docPdf.setLineWidth(0.4);
    docPdf.line(margin, yPos + 2, 210 - margin, yPos + 2);
    docPdf.line(margin, yPos + 3.5, 210 - margin, yPos + 3.5);
    yPos += 15;

    docPdf.setFont("times", "bold");
    docPdf.setFontSize(12);
    docPdf.text(docTitle.toUpperCase(), margin, yPos);
    yPos += 10;

    docPdf.setFont("times", "normal");
    docPdf.setFontSize(11);
    
    const bodyContent = isRti 
      ? `To:\nConstable Public Information Officer,\nGreater Chennai Corporation Zonal Grievance Registrar.\n\nRe: Unresolved Complaint Ref: ${c.complaintId} (${c.category})\n\nThis application is filed under Section 6(1) of the Right to Information Act, 2005. The applicant requests the following details regarding the grievance filed on ${c.createdAt} concerning ${c.category} at ${c.wardDetails}:\n\n1. Certified copies of all inspect reports, supervisor nudges, and office notes regarding the delay.\n2. The names and designations of all officers who held this file during the SLA breach period.\n3. The statutory reasons recorded for failing to meet the G.O. (Ms) No. 99 (21.09.2015) 30-day resolution mandate.`
      : `In the High Court of Judicature at Madras\n(Special Original Jurisdiction)\n\nWrit Petition No. GCC-${c.complaintId} of 2026\n\nIn the matter of Article 226 of the Constitution of India, seeking a Writ of Mandamus directing the Zonal Commissioner to resolve the persistent grievance of the petitioner. The petitioner cites the Madras High Court decision in Mumoorthy v. District Collector (June 2025) mandating swift administrative action. The petitioner is aggrieved by the continued inaction of the Ward Officers regarding the complaints filed under ref ${c.complaintId} on ${c.createdAt} in the Ward details: ${c.wardDetails}.`;

    const splitText = docPdf.splitTextToSize(bodyContent, 210 - (margin * 2));
    docPdf.text(splitText, margin, yPos);
    
    yPos += (splitText.length * 6) + 15;

    docPdf.setLineWidth(0.2);
    docPdf.line(margin, yPos, 210 - margin, yPos);
    yPos += 5;
    docPdf.setFont("times", "italic");
    docPdf.setFontSize(9);
    const citeText = isRti 
      ? "Citations: G.O. (Ms) No. 99, Personnel & Administrative Reforms Dept, 2015 · Sec 6(1), RTI Act 2005"
      : "Citations: Mumoorthy v. The District Collector, Madras HC, 2025 · Art 226, Constitution of India";
    docPdf.text(citeText, margin, yPos);

    yPos += 15;
    docPdf.setFont("times", "bold");
    docPdf.setFontSize(10);
    docPdf.text("CITIZEN SIGNATURE (JanAgni Secured OTP)", 210 - margin - 80, yPos);

    docPdf.save(`JanAgni_Document_${c.complaintId}.pdf`);
    showToast("Document downloaded as PDF");
  };

  const openReview = (c: Complaint) => {
    setSelectedComplaint(c);
    setOfficerNote(c.officerNote || "");
    setOfficerProofUrl(c.officerProofUrl || null);
  };

  const handleZonalNudge = async (c: Complaint) => {
    showToast(language === "ta" ? "நேரடி ஆணை பிறப்பிக்கப்பட்டது" : "Directive nudge issued by Zonal Commissioner!");
    await updateComplaintStageAction(c.complaintId, "internal_alert", c.daysElapsed, {
      officerNote: "Zonal Commissioner priority directive: Resolve immediately within grace window.",
      isDeclined: false
    });
    router.refresh();
  };

  return (
    <div className={`flex flex-col flex-1 animate-fade-in ${language === "ta" ? "font-tamil" : ""}`}>
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-ink-800 border border-border px-4 py-2.5 rounded-full text-xs font-mono text-text-100 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-sage-500 shadow-[0_0_8px_rgba(127,166,135,0.6)]" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h1 className={`font-semibold mb-1 text-2xl ${language === "ta" ? "font-bold font-tamil" : "font-fraunces"}`}>
          {t("officerTitle")}
        </h1>
        <p className="text-text-500 text-xs uppercase tracking-wider font-sans">
          {t("officerSub")}
        </p>
      </div>

      {/* Role Selection Tabs (Ward Officer vs Zonal Commissioner) */}
      <div className="flex border border-border rounded-xl p-1 bg-ink-800/80 mb-5 max-w-[340px]">
        <button
          onClick={() => setRole("ward")}
          className={`flex-1 py-1.5 text-center text-xs font-mono tracking-wider rounded-lg transition-all ${
            role === "ward" 
              ? "bg-ember-500 text-ink-900 font-bold" 
              : "text-text-500 hover:text-text-300"
          }`}
        >
          {language === "ta" ? "வார்டு அதிகாரி" : "Ward Officer"}
        </button>
        <button
          onClick={() => setRole("commissioner")}
          className={`flex-1 py-1.5 text-center text-xs font-mono tracking-wider rounded-lg transition-all ${
            role === "commissioner" 
              ? "bg-ember-500 text-ink-900 font-bold" 
              : "text-text-500 hover:text-text-300"
          }`}
        >
          {language === "ta" ? "மண்டல ஆணையர்" : "Zonal Commissioner"}
        </button>
      </div>

      {/* WARD OFFICER VIEW */}
      {role === "ward" && (
        <div className="animate-fade-in">
          {/* Dense Ward Officer KPIs */}
          <div className="grid grid-cols-4 gap-2.5 mb-5">
            <div className="bg-ink-800 border border-border rounded-xl p-2.5 flex flex-col items-center justify-center">
              <span className="text-[8.5px] text-text-500 uppercase font-mono tracking-wide">Breaches</span>
              <span className="text-lg font-mono font-bold text-ember-600 mt-0.5">{slaBreaches.length}</span>
            </div>
            <div className="bg-ink-800 border border-border rounded-xl p-2.5 flex flex-col items-center justify-center">
              <span className="text-[8.5px] text-text-500 uppercase font-mono tracking-wide">Active</span>
              <span className="text-lg font-mono font-bold text-text-200 mt-0.5">{activeComplaints.length}</span>
            </div>
            <div className="bg-ink-800 border border-border rounded-xl p-2.5 flex flex-col items-center justify-center">
              <span className="text-[8.5px] text-text-500 uppercase font-mono tracking-wide">RTIs</span>
              <span className="text-lg font-mono font-bold text-ember-500 mt-0.5">{activeRtis.length}</span>
            </div>
            <div className="bg-ink-800 border border-border rounded-xl p-2.5 flex flex-col items-center justify-center">
              <span className="text-[8.5px] text-text-500 uppercase font-mono tracking-wide">Avg SLA</span>
              <span className="text-lg font-mono font-bold text-sage-500 mt-0.5">{avgResolutionTime}</span>
            </div>
          </div>

          {/* Compliance Registry Table */}
          <h2 className="text-[10px] uppercase tracking-widest text-text-500 font-mono mb-2.5">
            {t("tableTitle")}
          </h2>

          {complaints.length === 0 ? (
            <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-sage-500 mb-3" />
              <h2 className={`font-medium text-text-100 mb-2 text-lg ${language === "ta" ? "font-bold font-tamil" : "font-fraunces"}`}>
                {t("emptyBreachesTitle")}
              </h2>
              <p className="text-text-300 text-sm mb-4 max-w-[28ch] font-sans">
                {t("emptyBreachesSub")}
              </p>
            </div>
          ) : (
            <div className="w-full bg-ink-800 border border-border rounded-custom overflow-hidden shadow-lg mb-4">
              <div className="overflow-x-auto [scrollbar-width:thin] pb-2">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-ink-700/50">
                      <th className="p-3 text-[10px] font-mono uppercase tracking-wider text-text-500">{t("tableColId")}</th>
                      <th className="p-3 text-[10px] font-mono uppercase tracking-wider text-text-500">{t("tableColCat")}</th>
                      <th className="p-3 text-[10px] font-mono uppercase tracking-wider text-text-500">{t("tableColSla")}</th>
                      <th className="p-3 text-[10px] font-mono uppercase tracking-wider text-text-500">{t("tableColEscalation")}</th>
                      <th className="p-3 text-[10px] font-mono uppercase tracking-wider text-text-500 text-right">{t("tableColAction")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.complaintId} className="border-b border-border last:border-0 hover:bg-ink-700/20 transition-colors">
                        <td className="p-3 font-mono text-xs">
                          <button 
                            onClick={() => openReview(c)}
                            className="text-text-300 hover:text-ember-500 hover:underline font-mono text-xs text-left"
                          >
                            {c.complaintId}
                          </button>
                        </td>
                        <td className="p-3 text-xs text-text-100 font-semibold font-sans">
                          {getTranslatedCategory(c.category)}
                        </td>
                        <td className="p-3 text-xs">
                          <div className="flex flex-col">
                            <span className="text-text-300 font-mono text-[11px]">
                              {language === "ta" ? `நாள் ${c.daysElapsed}` : `Day ${c.daysElapsed}`}
                            </span>
                            <span className={`text-[10px] ${getSlaColorClass(c)} font-mono`}>
                              {getSlaStatusText(c)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-text-300 font-sans">
                          <div className="flex items-center gap-1.5">
                            {c.stage === "internal_alert" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-ember-500 animate-pulse" />
                            )}
                            <span>{getStageLabel(c.stage, c.isDeclined)}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {c.stage === "resolved" ? (
                            <span className={`text-[10.5px] font-mono font-semibold px-2 py-1 ${c.isDeclined ? "text-red-400" : "text-sage-500"}`}>
                              {c.isDeclined 
                                ? (language === "ta" ? "நிராகரிக்கப்பட்டது" : "Declined")
                                : (language === "ta" ? "முடிந்தது" : "Archived")
                              }
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {c.stage === "internal_alert" && (
                                <span className="text-[8.5px] font-mono text-ember-500 font-bold border border-ember-500/40 bg-ember-500/5 px-1 py-0.5 rounded leading-none uppercase tracking-wide">
                                  {language === "ta" ? "சலுகை" : "Grace"}
                                </span>
                              )}
                              <button 
                                onClick={() => openReview(c)}
                                className="text-[10.5px] font-semibold px-2.5 py-1.5 bg-ink-700 hover:bg-ink-600 text-text-100 rounded-custom border border-border hover:border-text-300 transition-all focus-visible:outline-none"
                              >
                                {language === "ta" ? "சரிபார்" : "Review"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ZONAL COMMISSIONER VIEW */}
      {role === "commissioner" && (
        <div className="animate-fade-in">
          {/* Dense Commissioner KPIs */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <div className="bg-ink-800 border border-border rounded-xl p-2.5 flex flex-col items-center justify-center">
              <span className="text-[8.5px] text-text-500 uppercase font-mono tracking-wide">Zonal Alerts</span>
              <span className="text-lg font-mono font-bold text-ember-500 mt-0.5">{commissionerAlerts.length}</span>
            </div>
            <div className="bg-ink-800 border border-border rounded-xl p-2.5 flex flex-col items-center justify-center">
              <span className="text-[8.5px] text-text-500 uppercase font-mono tracking-wide">Pending Writs</span>
              <span className="text-lg font-mono font-bold text-ember-600 mt-0.5">{complaints.filter(c => c.stage === 'escalated').length}</span>
            </div>
            <div className="bg-ink-800 border border-border rounded-xl p-2.5 flex flex-col items-center justify-center">
              <span className="text-[8.5px] text-text-500 uppercase font-mono tracking-wide">Zonal Resolve Rate</span>
              <span className="text-lg font-mono font-bold text-sage-500 mt-0.5">
                {complaints.length > 0 
                  ? ((resolvedComplaints.length / complaints.length) * 100).toFixed(0) + "%"
                  : "100%"
                }
              </span>
            </div>
          </div>

          <h2 className="text-[10px] uppercase tracking-widest text-text-500 font-mono mb-2.5">
            Zonal Commissioner Grace Compliance Log (Day 30-37)
          </h2>

          {commissionerAlerts.length === 0 ? (
            <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center">
              <CheckCircle className="w-10 h-10 text-sage-500 mb-3" />
              <h2 className="font-fraunces text-text-100 mb-1 text-md font-bold">
                Zone is 100% Compliant
              </h2>
              <p className="text-text-300 text-xs max-w-[28ch] font-sans">
                No complaints are currently in the 7-day grace breach window.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {commissionerAlerts.map((c) => (
                <div key={c.complaintId} className="bg-ink-800 border border-border rounded-xl p-4 flex flex-col gap-3 shadow-md hover:border-ember-500 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-xs text-text-400">{c.complaintId} | {getTranslatedLocation(c.wardDetails)}</div>
                      <h4 className="font-sans font-bold text-xs text-text-100 mt-0.5">{getTranslatedCategory(c.category)}</h4>
                    </div>
                    <span className="text-[9.5px] font-mono text-ember-500 bg-ember-500/10 px-2 py-0.5 rounded-full border border-ember-500/20 uppercase font-bold tracking-wide">
                      Day {c.daysElapsed} Grace Active
                    </span>
                  </div>
                  
                  <p className="text-[11.5px] text-text-300 leading-relaxed font-sans truncate">
                    {c.transcript}
                  </p>

                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      onClick={() => handleZonalNudge(c)}
                      className="flex-1 py-1.5 bg-ember-600 hover:bg-ember-700 text-text-100 rounded-lg text-[10.5px] font-mono font-bold transition-colors"
                    >
                      Issue Commissioner Nudge
                    </button>
                    <button
                      onClick={() => openReview(c)}
                      className="py-1.5 px-4 bg-ink-700 hover:bg-ink-600 border border-border text-text-200 hover:text-text-100 rounded-lg text-[10.5px] font-mono transition-all"
                    >
                      Inspect File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Officer Review Modal */}
      {selectedComplaint && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedComplaint(null)}
        >
          <div 
            className="w-full max-w-[460px] max-height-[90vh] bg-[#F4F1E9] text-[#1C1C1C] rounded-t-2xl sm:rounded-2xl overflow-y-auto p-6 scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedComplaint(null)}
              className="float-right text-2xl text-[#666] hover:text-[#222]"
              aria-label={language === "en" ? "Close review modal" : "மதிப்பாய்வு சாளரத்தை மூடு"}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#8A5A2E] font-bold">
              {language === "ta" ? "அதிகாரி மதிப்பாய்வு" : "OFFICER REVIEW PORTAL"}
            </div>
            
            <h3 className="font-fraunces text-xl font-bold mt-1.5 mb-2 text-[#1C1C1C] leading-snug">
              {getTranslatedCategory(selectedComplaint.category)}
            </h3>
            <div className="font-mono text-[12px] text-[#555] mb-4">
              ID: {selectedComplaint.complaintId} | {getTranslatedLocation(selectedComplaint.wardDetails)}
            </div>

            {/* Attached Citizen Media (if present) */}
            {selectedComplaint.attachedMediaUrl && (
              <div className="border border-[#D8D3C4] rounded-lg p-3 mb-4 bg-[#FAF8F5]">
                <strong className="block mb-1.5 text-[10px] font-mono text-[#666] uppercase flex items-center gap-1">
                  {selectedComplaint.attachedMediaType === "image" ? <ImageIcon className="w-3.5 h-3.5" /> : <VideoIcon className="w-3.5 h-3.5" />}
                  Citizen Attached Proof
                </strong>
                {selectedComplaint.attachedMediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedComplaint.attachedMediaUrl} alt="Citizen attachment" className="max-h-[140px] w-full object-cover rounded border border-[#D8D3C4]" />
                ) : (
                  <video src={selectedComplaint.attachedMediaUrl} controls className="max-h-[140px] w-full rounded border border-[#D8D3C4]" />
                )}
              </div>
            )}

            {/* Description / Transcript */}
            <div className="bg-[#EAE6DB] rounded-lg p-3.5 mb-4 text-xs text-[#2A2A2A] leading-relaxed font-sans border border-[#D8D3C4]">
              <strong className="block mb-1 text-[11px] font-mono text-[#555] uppercase">Citizen Transcript</strong>
              {selectedComplaint.transcript}
            </div>

            {/* SLA / Timeline Details */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
              <div className="bg-[#EAE6DB] rounded-lg p-2.5 border border-[#D8D3C4]">
                <span className="text-[#666] block text-[9.5px]">TIMELINE</span>
                <span className="font-bold text-[#1C1C1C]">Day {selectedComplaint.daysElapsed} Elapsed</span>
              </div>
              <div className="bg-[#EAE6DB] rounded-lg p-2.5 border border-[#D8D3C4]">
                <span className="text-[#666] block text-[9.5px]">STATUS</span>
                <span className="font-bold text-ember-600">{getStageLabel(selectedComplaint.stage, selectedComplaint.isDeclined)}</span>
              </div>
            </div>

            {/* Higher Official Notification Warning details inside modal */}
            {selectedComplaint.stage === "internal_alert" && (
              <div className="border border-[#E4572E]/30 bg-[#E4572E]/5 rounded-lg p-3 mb-4 text-xs leading-relaxed text-ember-600 font-sans flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-ember-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#1C1C1C] font-mono text-[10px] uppercase">Zonal Grace Period Alert</strong>
                  <span>G.O. 99 breach registered. Zonal Commissioner has notified your office. Resolve this issue before Day 37 to avoid legal RTI auto-escalation.</span>
                </div>
              </div>
            )}

            {/* Document Draft Actions (if stage is RTI or Writ) */}
            {(selectedComplaint.stage === "rti_triggered" || selectedComplaint.stage === "escalated") && (
              <div className="border border-[#B8B3A4] rounded-lg p-3 mb-4 bg-[#FAF8F5]">
                <h4 className="text-xs font-bold text-[#8A5A2E] flex items-center gap-1.5 font-sans mb-1.5">
                  <FileText className="w-4 h-4" />
                  {selectedComplaint.stage === "rti_triggered" 
                    ? (language === "ta" ? "மனு: பிரிவு 6(1) RTI விண்ணப்பம்" : "Statutory Document: Section 6(1) RTI")
                    : (language === "ta" ? "மனு: பிரிவு 226 உயர்நீதிமன்ற மனு" : "Statutory Document: Article 226 Writ Petition")
                  }
                </h4>
                <p className="text-[11.5px] text-[#555] leading-relaxed mb-2.5 font-sans">
                  The legal escalation document has been automatically drafted and signed by the citizen.
                </p>
                <button
                  onClick={() => downloadOfficerPdf(selectedComplaint)}
                  className="w-full py-1.5 border border-[#8A5A2E] text-[#8A5A2E] hover:bg-[#8A5A2E]/5 rounded font-mono text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  Download Signed Document (PDF)
                </button>
              </div>
            )}

            {/* Officer Inputs Area: Proof Attachments and Decline Excuses */}
            <div className="border-t border-[#D8D3C4] pt-4 mt-4 flex flex-col gap-3.5">
              <div>
                <label className="block text-[10.5px] font-mono text-[#555] uppercase font-bold mb-1.5">
                  {language === "ta" ? "அதிகாரி குறிப்பு / நிராகரிப்பு காரணம்:" : "Excuse Notes / Resolution Proof Notes:"}
                </label>
                <textarea
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder={language === "ta" ? "தீர்க்கப்பட்டதற்கான ஆதாரம் அல்லது நிராகரிப்பதற்கான காரணம்..." : "Write details regarding resolution or reasons for declination here..."}
                  className="w-full bg-[#EAE6DB] border border-[#D8D3C4] rounded-lg p-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:ring-1 focus:ring-[#8A5A2E] font-sans resize-y min-h-[60px]"
                />
              </div>

              <div>
                <div className="block text-[10.5px] font-mono text-[#555] uppercase font-bold mb-1.5">
                  {language === "ta" ? "தீர்க்கப்பட்ட புகைப்பட ஆதாரம்:" : "Resolution Proof Photo (Optional):"}
                </div>
                {!officerProofUrl ? (
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#B8B3A4] rounded-lg text-xs font-semibold text-[#555] hover:text-[#1C1C1C] cursor-pointer hover:bg-black/5 transition-colors">
                    <PlusCircle className="w-4 h-4 text-[#8A5A2E]" />
                    <span>Attach Resolution Proof Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOfficerFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 bg-[#EAE6DB] p-2 border border-[#D8D3C4] rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={officerProofUrl} alt="Proof preview" className="w-10 h-10 object-cover rounded border border-[#D8D3C4]" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-[#1C1C1C] block truncate font-mono">Proof Attachment</span>
                      <span className="text-[9px] text-[#666] block">Attached successfully</span>
                    </div>
                    <button
                      onClick={() => setOfficerProofUrl(null)}
                      className="text-[9.5px] text-red-600 hover:text-red-800 font-mono uppercase underline px-1"
                    >
                      {language === "ta" ? "நீக்கு" : "Remove"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution / Decline Action Buttons */}
            <div className="mt-5 pt-3.5 border-t border-[#D8D3C4] flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Reject / Decline Button */}
                <button
                  onClick={async () => {
                    if (!officerNote.trim()) {
                      showToast(language === "ta" ? "நிராகரிக்க குறிப்பு தேவை!" : "Declination excuse note is required!");
                      return;
                    }
                    const compId = selectedComplaint.complaintId;
                    const daysEl = selectedComplaint.daysElapsed;
                    setSelectedComplaint(null);
                    showToast(language === "ta" ? "புகார் நிராகரிக்கப்பட்டது" : "Complaint Declined");
                    await updateComplaintStageAction(compId, "resolved", daysEl, {
                      officerNote: officerNote,
                      officerProofUrl: officerProofUrl || undefined,
                      isDeclined: true
                    });
                    router.refresh();
                  }}
                  className="py-3 bg-[#D37A6A] hover:bg-[#B55F50] text-white font-bold rounded-lg text-[13.5px] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <AlertOctagon className="w-4 h-4" />
                  {language === "ta" ? "நிராகரிக்க" : "Decline / Reject"}
                </button>

                {/* Approve / Mark as Resolved Button */}
                <button
                  onClick={async () => {
                    const compId = selectedComplaint.complaintId;
                    const daysEl = selectedComplaint.daysElapsed;
                    setSelectedComplaint(null);
                    showToast(language === "ta" ? "தீர்க்கப்பட்டதாக குறிக்கப்பட்டது" : "Marked as Resolved");
                    await updateComplaintStageAction(compId, "resolved", daysEl, {
                      officerNote: officerNote || "Completed and verified by ward engineer.",
                      officerProofUrl: officerProofUrl || undefined,
                      isDeclined: false
                    });
                    router.refresh();
                  }}
                  className="py-3 bg-[#7FA687] text-white hover:bg-[#688D70] font-bold rounded-lg text-[13.5px] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  {language === "ta" ? "தீர்க்கப்பட்டது" : "Mark Resolved"}
                </button>
              </div>

              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-full py-2 border border-[#B8B3A4] text-[#555] hover:bg-black/5 font-medium rounded-lg text-xs transition-colors"
              >
                {language === "ta" ? "மூடுக" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
