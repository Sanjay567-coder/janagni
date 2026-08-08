"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function Navigation() {
  const pathname = usePathname();
  const { language, t } = useLanguage();

  if (pathname === "/onboarding") return null;

  const isHome = pathname === "/" || pathname.startsWith("/resolution");
  const isComplaints = pathname === "/complaints";
  const isOfficer = pathname === "/officer";

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] sm:max-w-[420px] bg-ink-800/95 backdrop-blur-md border-t border-border z-40 px-6 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center w-full">
        {/* Home */}
        <Link 
          href="/"
          className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500 rounded ${
            isHome ? "text-ember-500" : "text-text-500 hover:text-text-300"
          }`}
          aria-label={t("navHome")}
        >
          <Home className="w-5 h-5" />
          <span className={`text-[10px] font-semibold tracking-wider uppercase ${language === "ta" ? "font-tamil" : "font-sans"}`}>
            {t("navHome")}
          </span>
        </Link>

        {/* My Complaints */}
        <Link 
          href="/complaints"
          className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500 rounded ${
            isComplaints ? "text-ember-500" : "text-text-500 hover:text-text-300"
          }`}
          aria-label={t("navComplaints")}
        >
          <ClipboardList className="w-5 h-5" />
          <span className={`text-[10px] font-semibold tracking-wider uppercase ${language === "ta" ? "font-tamil" : "font-sans"}`}>
            {t("navComplaints")}
          </span>
        </Link>

        {/* Officer View (Demo-only) */}
        <Link 
          href="/officer"
          className={`flex flex-col items-center gap-1 flex-1 py-1.5 relative transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500 rounded ${
            isOfficer ? "text-ember-500" : "text-text-500 hover:text-text-300"
          }`}
          aria-label={t("navOfficer")}
        >
          <span className="absolute -top-1.5 right-1/2 translate-x-8 text-[7px] bg-ember-600 text-text-100 font-bold px-1.5 py-0.5 rounded-full uppercase scale-90">
            Demo
          </span>
          <ShieldAlert className="w-5 h-5" />
          <span className={`text-[10px] font-semibold tracking-wider uppercase ${language === "ta" ? "font-tamil" : "font-sans"}`}>
            {t("navOfficer")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
