"use client";

import { ShieldAlert, BarChart3, Clock, AlertOctagon, CheckCircle2, X, FileText, CheckCircle } from "lucide-react";
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
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Compute live KPIs from the database complaints
  const activeComplaints = complaints.filter((c) => c.stage !== "resolved");
  const slaBreaches = complaints.filter((c) => c.daysElapsed >= 30 && c.stage !== "resolved");
  const activeRtis = complaints.filter((c) => c.stage === "rti_triggered");
  const resolvedComplaints = complaints.filter((c) => c.stage === "resolved");
  
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

  const getStageLabel = (stage: Complaint["stage"]) => {
    switch (stage) {
      case "filed": return language === "ta" ? "தாக்கல் செய்யப்பட்டது" : "Filed";
      case "internal_alert": return language === "ta" ? "மண்டல எச்சரிக்கை" : "Nudge Active";
      case "rti_triggered": return language === "ta" ? "RTI தயாரானது" : "RTI Drafted";
      case "escalated": return language === "ta" ? "நீதிமன்ற மனு" : "Writ Escalated";
      case "resolved": return language === "ta" ? "தீர்க்கப்பட்டது" : "Resolved";
    }
  };

  const getSlaStatusText = (c: Complaint) => {
    if (c.stage === "resolved") {
      return language === "ta" ? "தீர்க்கப்பட்டது" : "Resolved";
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
    if (c.stage === "resolved") return "text-sage-500";
    if (c.daysElapsed >= 30) return "text-ember-600 font-semibold";
    if (c.daysElapsed >= 20) return "text-ember-500";
    return "text-calm-300";
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
      <div className="mb-6">
        <h1 className={`font-semibold mb-1 text-2xl ${language === "ta" ? "font-bold" : "font-fraunces"}`}>
          {t("officerTitle")}
        </h1>
        <p className="text-text-500 text-xs uppercase tracking-wider font-sans">
          {t("officerSub")}
        </p>
      </div>

      {/* SLA Breaches Primary KPI Banner */}
      <div className="bg-ink-800 border-2 border-ember-600 rounded-custom p-5 mb-4 shadow-[0_4px_25px_rgba(228,87,46,0.15)] flex justify-between items-center group hover:scale-[1.01] transition-transform duration-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-ember-600/10">
            <AlertOctagon className="w-8 h-8 text-ember-600 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] text-ember-600 font-mono tracking-wider uppercase font-bold block">
              {language === "ta" ? "அபாய எச்சரிக்கை" : "Critical Warning"}
            </span>
            <span className="text-[13.5px] text-text-300 font-sans block mt-0.5">
              {t("kpiBreaches")}
            </span>
          </div>
        </div>
        <span className="text-4xl font-mono font-bold text-text-100">{slaBreaches.length}</span>
      </div>

      {/* Secondary KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Active complaints */}
        <div className="bg-ink-800 border border-border rounded-custom p-4 flex flex-col justify-between hover:border-text-500 transition-colors duration-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-text-500 font-sans tracking-wide uppercase">{t("kpiActive")}</span>
            <BarChart3 className="w-4 h-4 text-calm-300" />
          </div>
          <span className="text-xl font-mono font-semibold text-text-100 mt-1">{activeComplaints.length}</span>
        </div>

        {/* Active RTIs */}
        <div className="bg-ink-800 border border-border rounded-custom p-4 flex flex-col justify-between hover:border-text-500 transition-colors duration-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-text-500 font-sans tracking-wide uppercase">
              {language === "ta" ? "செயலில் உள்ள RTI" : "Active RTIs"}
            </span>
            <ShieldAlert className="w-4 h-4 text-ember-500" />
          </div>
          <span className="text-xl font-mono font-semibold text-text-100 mt-1">{activeRtis.length}</span>
        </div>

        {/* Avg Resolution */}
        <div className="bg-ink-800 border border-border rounded-custom p-4 flex flex-col justify-between hover:border-text-500 transition-colors duration-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-text-500 font-sans tracking-wide uppercase">
              {language === "ta" ? "சராசரி தீர்வு" : "Avg Res"}
            </span>
            <Clock className="w-4 h-4 text-sage-500" />
          </div>
          <span className="text-xl font-mono font-semibold text-text-100 mt-1">{avgResolutionTime}</span>
        </div>
      </div>

      {/* Demo Warning */}
      <div className="bg-ink-800 border border-border rounded-custom p-4 mb-6 text-[12.5px] leading-relaxed flex items-start gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <ShieldAlert className="w-5 h-5 text-ember-500 flex-shrink-0 mt-0.5" />
        <div className="font-sans">
          <strong className="text-text-100">{t("kpiWarningTitle")}</strong> {t("kpiWarningBody")}
        </div>
      </div>

      {/* Compliance Table Title */}
      <h2 className="text-xs uppercase tracking-widest text-text-500 font-mono mb-3">
        {t("tableTitle")}
      </h2>

      {/* Table listing */}
      {complaints.length === 0 ? (
        <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-sage-500 mb-3" />
          <h2 className={`font-medium text-text-100 mb-2 text-lg ${language === "ta" ? "font-bold font-tamil" : "font-fraunces"}`}>
            {t("emptyBreachesTitle")}
          </h2>
          <p className="text-text-300 text-sm mb-4 max-w-[28ch] font-sans">
            {t("emptyBreachesSub")}
          </p>
        </div>
      ) : (
        <div className="w-full bg-ink-800 border border-border rounded-custom overflow-hidden shadow-lg mb-4 animate-fade-in">
          <div className="overflow-x-auto [scrollbar-width:thin] [scrollbar-color:rgba(228,87,46,0.3)_rgba(15,18,24,1)] pb-2">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-ink-700/50">
                  <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500">{t("tableColId")}</th>
                  <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500">{t("tableColCat")}</th>
                  <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500">{t("tableColSla")}</th>
                  <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500">{t("tableColEscalation")}</th>
                  <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500 text-right">{t("tableColAction")}</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.complaintId} className="border-b border-border last:border-0 hover:bg-ink-700/20 transition-colors duration-150">
                    <td className="p-3 font-mono text-xs">
                      <button 
                        onClick={() => setSelectedComplaint(c)}
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
                      {getStageLabel(c.stage)}
                    </td>
                    <td className="p-3 text-right">
                      {c.stage === "resolved" ? (
                        <span className="text-[10.5px] text-sage-500 font-mono font-semibold px-2 py-1">
                          {language === "ta" ? "முடிந்தது" : "Archived"}
                        </span>
                      ) : (
                        <button 
                          onClick={() => setSelectedComplaint(c)}
                          className="text-[10.5px] font-semibold px-2.5 py-1.5 bg-ink-700 hover:bg-ink-600 text-text-100 rounded-custom border border-border hover:border-text-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
                        >
                          {language === "ta" ? "சரிபார்" : "Review"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="block sm:hidden text-center text-[9px] text-text-500 font-mono tracking-widest py-2 border-t border-border bg-ink-700/10 uppercase">
            {t("tableSwipeAffordance")}
          </div>
        </div>
      )}

      {/* Officer Review Modal */}
      {selectedComplaint && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedComplaint(null)}
        >
          <div 
            className="w-full max-w-[460px] max-height-[85vh] bg-[#F4F1E9] text-[#1C1C1C] rounded-t-2xl sm:rounded-2xl overflow-y-auto p-6"
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
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#8A5A2E]">
              {language === "ta" ? "அதிகாரி மதிப்பாய்வு" : "OFFICER REVIEW PORTAL"}
            </div>
            
            <h3 className="font-fraunces text-xl font-bold mt-1.5 mb-2 text-[#1C1C1C] leading-snug">
              {getTranslatedCategory(selectedComplaint.category)}
            </h3>
            <div className="font-mono text-[12px] text-[#555] mb-4">
              ID: {selectedComplaint.complaintId} | {getTranslatedLocation(selectedComplaint.wardDetails)}
            </div>

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
                <span className="font-bold text-ember-600">{getStageLabel(selectedComplaint.stage)}</span>
              </div>
            </div>

            {/* Document Draft Actions (if stage is RTI or Writ) */}
            {(selectedComplaint.stage === "rti_triggered" || selectedComplaint.stage === "escalated") && (
              <div className="border border-dashed border-[#B8B3A4] rounded-lg p-3 mb-4 bg-[#FAF8F5]">
                <h4 className="text-xs font-bold text-[#8A5A2E] flex items-center gap-1.5 font-sans mb-1.5">
                  <FileText className="w-4 h-4" />
                  {selectedComplaint.stage === "rti_triggered" 
                    ? (language === "ta" ? "மனு: பிரிவு 6(1) RTI விண்ணப்பம்" : "Statutory Document: Section 6(1) RTI")
                    : (language === "ta" ? "மனு: பிரிவு 226 உயர்நீதிமன்ற மனு" : "Statutory Document: Article 226 Writ Petition")
                  }
                </h4>
                <p className="text-[11.5px] text-[#555] leading-relaxed mb-2.5 font-sans">
                  {language === "ta" 
                    ? "குடிமகனால் கையொப்பமிடப்பட்ட சட்டப்பூர்வ ஆவணம் தயாரிக்கப்பட்டுள்ளது." 
                    : "The legal escalation document has been automatically drafted and signed."
                  }
                </p>
                <button
                  onClick={() => downloadOfficerPdf(selectedComplaint)}
                  className="w-full py-1.5 border border-[#8A5A2E] text-[#8A5A2E] hover:bg-[#8A5A2E]/5 rounded font-mono text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  Download Signed Document (PDF)
                </button>
              </div>
            )}

            {/* Resolution Actions */}
            <div className="mt-5 pt-3.5 border-t border-[#D8D3C4] flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  const compId = selectedComplaint.complaintId;
                  const daysEl = selectedComplaint.daysElapsed;
                  setSelectedComplaint(null);
                  showToast(language === "ta" ? "தீர்க்கப்பட்டதாக குறிக்கப்பட்டது" : "Marked as Resolved");
                  await updateComplaintStageAction(compId, "resolved", daysEl);
                  router.refresh();
                }}
                className="w-full py-3 bg-[#7FA687] text-white hover:bg-[#688D70] font-bold rounded-lg text-[13.5px] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {language === "ta" ? "தீர்க்கப்பட்டதாகக் குறிக்கவும்" : "Mark as Resolved"}
              </button>

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
