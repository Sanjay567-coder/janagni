"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const [lang, setLang] = useState<"en" | "ta">("en");
  const router = useRouter();

  // Load saved preference if exists
  useEffect(() => {
    const saved = localStorage.getItem("janagni_lang");
    if (saved === "ta" || saved === "en") {
      setLang(saved);
    }
  }, []);

  const handleContinue = () => {
    localStorage.setItem("janagni_lang", lang);
    router.push("/");
  };

  return (
    <div className="flex flex-col flex-1 justify-center items-center py-10 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-8">
        <svg className="w-8.5 h-8.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 7 7.5 7 12.5C7 16 9.5 19 12 19C14.5 19 17 16 17 12.5C17 10.8 16.2 9.5 15.3 8.3C15.6 10 15 11 14 11.5C14.3 9.5 13.5 7 12 2Z" fill="url(#g0)"/>
          <path d="M10.5 13C10.5 15 11.2 16.5 12 16.5C12.8 16.5 13.5 15 13.5 13C13.5 11.8 12.9 11 12 10C11.6 11.3 11 12 10.5 13Z" fill="#0F1218" opacity="0.55"/>
          <defs><linearGradient id="g0" x1="7" y1="2" x2="17" y2="19"><stop stopColor="#F5A623"/><stop offset="1" stopColor="#E4572E"/></linearGradient></defs>
        </svg>
        <div>
          <h1 className="font-fraunces text-2xl font-semibold tracking-wide">JanAgni</h1>
          <p className="text-[11px] text-text-500 uppercase tracking-widest">Civic escalation, automated</p>
        </div>
      </div>

      <div className="w-full bg-ink-800 border border-border rounded-custom p-6 mb-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <h2 className="font-fraunces text-xl font-medium mb-3">
          {lang === "en" ? "Select Language" : <span className="font-tamil font-semibold">மொழி தேர்வு</span>}
        </h2>
        <p className="text-text-300 text-[13.5px] leading-relaxed mb-6">
          {lang === "en" ? (
            "Speak your complaint in English or Tamil. JanAgni drafts statutory RTI requests and Article 226 legal documents automatically."
          ) : (
            <span className="font-tamil">
              உங்கள் புகாரை ஆங்கிலம் அல்லது தமிழில் கூறுங்கள். ஜனஅக்னி தானியங்கி முறையில் சட்ட ரீதியிலான ஆவணங்களை உருவாக்கும்.
            </span>
          )}
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setLang("en")}
            className={`py-4 rounded-custom border transition-all text-[14.5px] font-sans ${
              lang === "en"
                ? "border-ember-500 bg-ink-700 text-text-100 font-semibold"
                : "border-border bg-ink-800 text-text-300 hover:bg-ink-700"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang("ta")}
            className={`py-4 rounded-custom border transition-all text-[14.5px] font-tamil font-semibold ${
              lang === "ta"
                ? "border-ember-500 bg-ink-700 text-text-100"
                : "border-border bg-ink-800 text-text-300 hover:bg-ink-700"
            }`}
          >
            தமிழ்
          </button>
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3.5 rounded-full bg-text-100 text-ink-900 font-bold hover:opacity-90 transition-opacity text-[14.5px] font-sans"
        >
          {lang === "en" ? "Continue" : <span className="font-tamil font-bold">தொடர்க</span>}
        </button>
      </div>

      <div className="text-[11px] text-text-500 uppercase tracking-widest text-center">
        Sec. 6(1) RTI &amp; Art. 226 Escalation Enabled
      </div>
    </div>
  );
}
