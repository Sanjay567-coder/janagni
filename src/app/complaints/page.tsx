import { getComplaints, Complaint } from "@/lib/db";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

export const revalidate = 0;

function getStageIndicator(stage: Complaint["stage"]) {
  let colorClass = "";
  let label = "";
  switch (stage) {
    case "filed":
      colorClass = "bg-calm-500 shadow-[0_0_8px_rgba(91,138,166,0.6)]";
      label = "Filed";
      break;
    case "internal_alert":
      colorClass = "bg-ember-500 shadow-[0_0_8px_rgba(245,166,35,0.6)]";
      label = "Supervisory Nudge";
      break;
    case "rti_triggered":
      colorClass = "bg-ember-600 shadow-[0_0_8px_rgba(228,87,46,0.6)]";
      label = "RTI Drafted";
      break;
    case "escalated":
      colorClass = "bg-ember-600 shadow-[0_0_8px_rgba(228,87,46,0.6)]";
      label = "Writ Escalated";
      break;
    case "resolved":
      colorClass = "bg-sage-500 shadow-[0_0_8px_rgba(127,166,135,0.6)]";
      label = "Resolved";
      break;
  }
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] font-sans font-medium text-text-300">
      <span className={`w-2 h-2 rounded-full ${colorClass}`} />
      {label}
    </span>
  );
}

export default async function ComplaintsPage() {
  const complaints = await getComplaints();

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-semibold mb-1">My Complaints</h1>
        <p className="text-text-500 text-xs uppercase tracking-wider font-sans">
          Track active grievances and statutory escalations
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <FileText className="w-12 h-12 text-text-500 mb-4" />
          <h2 className="font-fraunces text-xl font-medium text-text-100 mb-2">No complaints filed yet</h2>
          <p className="text-text-300 text-[13.5px] mb-6 max-w-[28ch] leading-relaxed font-sans">
            Speak or type your grievance on the home screen. JanAgni will auto-track the SLA timeline and compile drafts.
          </p>
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3 bg-text-100 text-ink-900 rounded-full text-[13.5px] font-bold hover:bg-text-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 active:scale-[0.99] text-center"
          >
            File a Grievance
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {complaints.map((c) => {
            const dateStr = new Date(c.createdAt).toLocaleDateString("en-IN", {
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

                    <h3 className="font-fraunces text-[18px] font-semibold mt-2 text-text-100 group-hover:text-ember-500 transition-colors leading-snug">
                      {c.category}
                    </h3>
                    <p className="text-text-300 text-[13px] mt-1 line-clamp-1 font-sans">{c.wardDetails}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                      {getStageIndicator(c.stage)}
                      <span className="text-[12.5px] text-text-500 font-mono group-hover:text-text-300 transition-colors flex items-center gap-0.5">
                        Track SLA
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
