"use client";

import { ShieldAlert, BarChart3, Clock, AlertOctagon, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Complaint } from "@/lib/db";
import Link from "next/link";

interface OfficerClientProps {
  complaints: Complaint[];
}

export default function OfficerClient({ complaints }: OfficerClientProps) {
  const { language, t } = useLanguage();

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

  return (
    <div className={`flex flex-col flex-1 animate-fade-in ${language === "ta" ? "font-tamil" : ""}`}>
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
        <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center">
          <CheckCircle2 className="w-12 h-12 text-sage-500 mb-3" />
          <h2 className={`font-medium text-text-100 mb-2 text-lg ${language === "ta" ? "font-bold" : "font-fraunces"}`}>
            {t("emptyBreachesTitle")}
          </h2>
          <p className="text-text-300 text-sm mb-4 max-w-[28ch] font-sans">
            {t("emptyBreachesSub")}
          </p>
        </div>
      ) : (
        <div className="w-full bg-ink-800 border border-border rounded-custom overflow-hidden shadow-lg mb-4">
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
                    <td className="p-3 font-mono text-xs text-text-300">
                      <Link href={`/?id=${c.complaintId}`} className="hover:text-ember-500 hover:underline">
                        {c.complaintId}
                      </Link>
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
                        <Link 
                          href={`/?id=${c.complaintId}`}
                          className="text-[10.5px] font-semibold px-2.5 py-1.5 bg-ink-700 hover:bg-ink-600 text-text-100 rounded-custom border border-border hover:border-text-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
                        >
                          {language === "ta" ? "சரிபார்" : "Review"}
                        </Link>
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
    </div>
  );
}
