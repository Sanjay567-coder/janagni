"use client";

import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Complaint } from "@/lib/db";

interface ComplaintsClientProps {
  initialComplaints: Complaint[];
}

export default function ComplaintsClient({ initialComplaints }: ComplaintsClientProps) {
  const { language, t } = useLanguage();

  const getStageIndicator = (stage: Complaint["stage"]) => {
    let colorClass = "";
    let label = "";
    switch (stage) {
      case "filed":
        colorClass = "bg-calm-500 shadow-[0_0_8px_rgba(91,138,166,0.6)]";
        label = language === "ta" ? "தாக்கல் செய்யப்பட்டது" : "Filed";
        break;
      case "internal_alert":
        colorClass = "bg-ember-500 shadow-[0_0_8px_rgba(245,166,35,0.6)]";
        label = language === "ta" ? "மண்டல எச்சரிக்கை" : "Supervisory Nudge";
        break;
      case "rti_triggered":
        colorClass = "bg-ember-600 shadow-[0_0_8px_rgba(228,87,46,0.6)]";
        label = language === "ta" ? "RTI தயாரானது" : "RTI Drafted";
        break;
      case "escalated":
        colorClass = "bg-ember-600 shadow-[0_0_8px_rgba(228,87,46,0.6)]";
        label = language === "ta" ? "நீதிமன்ற மனு" : "Writ Escalated";
        break;
      case "resolved":
        colorClass = "bg-sage-500 shadow-[0_0_8px_rgba(127,166,135,0.6)]";
        label = language === "ta" ? "தீர்க்கப்பட்டது" : "Resolved";
        break;
    }
    return (
      <span className="inline-flex items-center gap-2 text-[12.5px] font-sans font-medium text-text-300">
        <span className={`w-2 h-2 rounded-full ${colorClass}`} />
        {label}
      </span>
    );
  };

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
      // e.g. "Ward 172 · Velachery, Chennai"
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

  return (
    <div className={`flex flex-col flex-1 animate-fade-in ${language === "ta" ? "font-tamil" : ""}`}>
      <div className="mb-6">
        <h1 className={`font-semibold mb-1 text-2xl ${language === "ta" ? "font-bold" : "font-fraunces"}`}>
          {t("complaintsTitle")}
        </h1>
        <p className="text-text-500 text-xs uppercase tracking-wider font-sans">
          {t("complaintsSub")}
        </p>
      </div>

      {initialComplaints.length === 0 ? (
        <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <FileText className="w-12 h-12 text-text-500 mb-4" />
          <h2 className={`font-medium text-text-100 mb-2 text-xl ${language === "ta" ? "font-bold" : "font-fraunces"}`}>
            {t("complaintsEmptyTitle")}
          </h2>
          <p className="text-text-300 text-[13.5px] mb-6 max-w-[28ch] leading-relaxed font-sans">
            {t("complaintsEmptySub")}
          </p>
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3 bg-text-100 text-ink-900 rounded-full text-[13.5px] font-bold hover:bg-text-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 active:scale-[0.99] text-center font-sans"
          >
            {t("complaintsEmptyBtn")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {initialComplaints.map((c) => {
            const dateStr = new Date(c.createdAt).toLocaleDateString(language === "ta" ? "ta-IN" : "en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <Link
                key={c.complaintId}
                href={`/?id=${c.complaintId}`}
                className="block bg-ink-800 border border-border rounded-custom p-5 hover:border-text-500 hover:bg-ink-700/35 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap font-mono text-[11px] text-text-500">
                      <span>{c.complaintId}</span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>

                    <h3 className={`text-[18px] font-semibold mt-2 text-text-100 group-hover:text-ember-500 transition-colors leading-snug ${language === "ta" ? "font-bold" : "font-fraunces"}`}>
                      {getTranslatedCategory(c.category)}
                    </h3>
                    <p className="text-text-300 text-[13px] mt-1 line-clamp-1 font-sans">
                      {getTranslatedLocation(c.wardDetails)}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                      {getStageIndicator(c.stage)}
                      <span className="text-[12.5px] text-text-500 font-mono group-hover:text-text-300 transition-colors flex items-center gap-0.5">
                        {t("trackSla")}
                        <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
