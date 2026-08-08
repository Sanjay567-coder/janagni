"use client";

import { useLanguage } from "@/components/LanguageContext";
import { useEffect, useState } from "react";

export default function FloatingLanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute top-2.5 sm:top-5 right-0 z-40 flex items-center bg-ink-800/90 border border-border rounded-full p-0.5 shadow-md">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500 ${
          language === "en" 
            ? "bg-text-100 text-ink-900 font-bold shadow-xs" 
            : "text-text-500 hover:text-text-100"
        }`}
        aria-label="Set language to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ta")}
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-tamil transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500 ${
          language === "ta" 
            ? "bg-text-100 text-ink-900 font-bold shadow-xs" 
            : "text-text-500 hover:text-text-100"
        }`}
        aria-label="தமிழ் மொழிக்கு மாற்றவும்"
      >
        தமிழ்
      </button>
    </div>
  );
}
