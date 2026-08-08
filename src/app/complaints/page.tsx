import { getComplaints, Complaint } from "@/lib/db";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

export const revalidate = 0;

function getStageBadge(stage: Complaint["stage"]) {
  switch (stage) {
    case "filed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-calm-500/20 text-calm-300 border border-calm-500/30">
          Filed
        </span>
      );
    case "internal_alert":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-ember-500/20 text-ember-500 border border-ember-500/30">
          Nudge Active
        </span>
      );
    case "rti_triggered":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-ember-600/20 text-ember-600 border border-ember-600/30">
          RTI Drafted
        </span>
      );
    case "escalated":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30">
          Writ Petition
        </span>
      );
    case "resolved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-sage-500/20 text-sage-500 border border-sage-500/30">
          Resolved
        </span>
      );
  }
}

export default async function ComplaintsPage() {
  const complaints = await getComplaints();

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-semibold mb-1">My Complaints</h1>
        <p className="text-text-500 text-xs uppercase tracking-wider">
          Track active grievances and statutory escalations
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-text-500 mb-3" />
          <h2 className="font-fraunces text-lg font-medium text-text-100 mb-2">No complaints filed yet</h2>
          <p className="text-text-300 text-sm mb-6 max-w-[28ch]">
            Speak or type a grievance. JanAgni will auto-track and escalate it.
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 bg-text-100 text-ink-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
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
                className="block bg-ink-800 border border-border rounded-custom p-4.5 hover:border-text-500 transition-colors group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-text-500">{c.complaintId}</span>
                      <span className="text-[11px] text-text-500">•</span>
                      <span className="text-[11px] text-text-500 font-sans">{dateStr}</span>
                    </div>

                    <h3 className="font-fraunces text-[17px] font-semibold mt-2 group-hover:text-ember-500 transition-colors">
                      {c.category}
                    </h3>
                    <p className="text-text-300 text-[12.5px] mt-1 line-clamp-1">{c.wardDetails}</p>

                    <div className="mt-3.5 flex items-center justify-between">
                      {getStageBadge(c.stage)}
                      <span className="text-xs text-text-500 font-mono group-hover:text-text-300 transition-colors flex items-center gap-0.5">
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
