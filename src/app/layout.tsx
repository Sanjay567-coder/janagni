import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-noto-sans-tamil",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "JanAgni - Civic Grievance Escalation",
  description: "Report it once. Let the fire stay on it. Automated civic grievance escalation app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${fraunces.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${notoSansTamil.variable}`}
    >
      <body className="font-sans antialiased text-text-100 min-h-dvh flex justify-center px-4 md:px-0">
        <div className="w-full max-w-[460px] sm:max-w-[420px] pt-6 sm:pt-14 pb-[130px] flex flex-col">
          {children}
          <Navigation />
        </div>
      </body>
    </html>
  );
}
