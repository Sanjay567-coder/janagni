"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

export default function Onboarding() {
  const { language, setLanguage, t } = useLanguage();
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 350);
  };

  return (
    <div 
      className={`flex flex-col flex-1 justify-center items-center py-10 transition-all duration-300 ease-out ${
        isExiting ? "opacity-0 scale-[0.97] blur-[2px]" : "opacity-100 scale-100 animate-fade-in"
      } ${language === "ta" ? "font-tamil" : ""}`}
    >
      <div className="flex items-center gap-2.5 mb-8">
        <svg className="w-8.5 h-8.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 7 7.5 7 12.5C7 16 9.5 19 12 19C14.5 19 17 16 17 12.5C17 10.8 16.2 9.5 15.3 8.3C15.6 10 15 11 14 11.5C14.3 9.5 13.5 7 12 2Z" fill="url(#g0)"/>
          <path d="M10.5 13C10.5 15 11.2 16.5 12 16.5C12.8 16.5 13.5 15 13.5 13C13.5 11.8 12.9 11 12 10C11.6 11.3 11 12 10.5 13Z" fill="#0F1218" opacity="0.55"/>
          <defs><linearGradient id="g0" x1="7" y1="2" x2="17" y2="19"><stop stopColor="#F5A623"/><stop offset="1" stopColor="#E4572E"/></linearGradient></defs>
        </svg>
        <div>
          <h1 className="font-fraunces text-2xl font-semibold tracking-wide">{t("brandTitle")}</h1>
          <p className="text-[11px] text-text-500 tracking-wider uppercase font-sans">
            {t("brandSub")}
          </p>
        </div>
      </div>

      <div className="w-full bg-ink-800 border border-border rounded-custom p-6 mb-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <h2 className={`font-medium mb-3 text-xl ${language === "ta" ? "font-bold font-tamil" : "font-fraunces"}`}>
          {t("onboardingTitle")}
        </h2>
        <p className="text-text-300 text-[13.5px] leading-relaxed mb-6 font-sans">
          {t("onboardingSub")}
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setLanguage("en")}
            className={`py-4 rounded-custom border transition-all text-[14.5px] font-sans font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 ${
              language === "en"
                ? "border-ember-500 bg-ink-700 text-text-100 shadow-[0_0_15px_rgba(245,166,35,0.15)]"
                : "border-border bg-ink-800 text-text-300 hover:bg-ink-700 hover:text-text-100 hover:border-text-500"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("ta")}
            className={`py-4 rounded-custom border transition-all text-[14.5px] font-tamil font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 ${
              language === "ta"
                ? "border-ember-500 bg-ink-700 text-text-100 shadow-[0_0_15px_rgba(245,166,35,0.15)]"
                : "border-border bg-ink-800 text-text-300 hover:bg-ink-700 hover:text-text-100 hover:border-text-500"
            }`}
          >
            தமிழ்
          </button>
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3.5 rounded-full bg-text-100 text-ink-900 font-bold hover:bg-text-300 hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 active:scale-[0.99] text-[14.5px] font-sans"
        >
          {t("onboardingContinue")}
        </button>
      </div>

      <div className="text-[11px] text-text-500 uppercase tracking-widest text-center font-mono">
        {t("onboardingFooter")}
      </div>
    </div>
  );
}
