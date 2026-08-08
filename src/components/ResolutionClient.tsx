"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitResolutionFeedbackAction } from "@/app/actions";
import { Complaint } from "@/lib/db";
import { Check, X, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";

interface ResolutionClientProps {
  complaint: Complaint;
}

export default function ResolutionClient({ complaint }: ResolutionClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"fixed" | "unfixed" | null>(null);

  const handleFeedback = async (isFixed: boolean) => {
    setIsSubmitting(true);
    setFeedbackType(isFixed ? "fixed" : "unfixed");
    
    await submitResolutionFeedbackAction(complaint.complaintId, isFixed);
    
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/?id=${complaint.complaintId}`);
    }, 2000);
  };

  return (
    <div className="flex flex-col flex-1 animate-fade-in justify-center py-6">
      {/* Header */}
      <button 
        onClick={() => router.back()} 
        className="self-start text-xs text-text-500 hover:text-text-300 flex items-center gap-1 mb-6 font-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      {feedbackType === null ? (
        <div className="bg-ink-800 border border-border rounded-custom p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-sage-500/20 text-sage-500 text-[10.5px] font-mono border border-sage-500/30">
              Resolved State
            </span>
            <span className="font-mono text-[11px] text-text-500">{complaint.complaintId}</span>
          </div>

          <h1 className="font-fraunces text-xl font-semibold mb-2">Verify Resolution</h1>
          <p className="text-text-300 text-[13.5px] leading-relaxed mb-6 font-sans">
            The municipal ward officer has marked this issue as resolved. Please inspect the site and confirm if the work has been completed satisfactorily.
          </p>

          {/* Details Card */}
          <div className="bg-ink-700/60 rounded-xl p-4 mb-6 border border-border">
            <div className="text-[10px] text-text-500 uppercase tracking-wider font-mono mb-1">Grievance Category</div>
            <div className="font-semibold text-text-100 text-[14.5px] font-fraunces mb-2">{complaint.category}</div>
            <div className="text-[10px] text-text-500 uppercase tracking-wider font-mono mb-1">Description</div>
            <div className="text-text-300 text-[13px] leading-relaxed font-sans">{complaint.transcript}</div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleFeedback(true)}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-sage-500 text-ink-900 font-bold rounded-full text-[13.5px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity font-sans"
            >
              <Check className="w-4.5 h-4.5" />
              Confirm Resolved
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={isSubmitting}
              className="w-full py-3.5 border border-ember-600 text-ember-600 hover:bg-ember-600/10 font-bold rounded-full text-[13.5px] flex items-center justify-center gap-2 transition-all font-sans"
            >
              <X className="w-4.5 h-4.5" />
              Not Actually Fixed
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-fade-in">
          {feedbackType === "fixed" ? (
            <>
              <div className="w-16 h-16 bg-sage-500/20 text-sage-500 border border-sage-500/30 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="font-fraunces text-xl font-semibold mb-2">Thank you!</h2>
              <p className="text-text-300 text-sm leading-relaxed max-w-[28ch]">
                Grievance status finalized. Your feedback has been recorded in the ward database.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-ember-600/20 text-ember-600 border border-ember-600/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <h2 className="font-fraunces text-xl font-semibold mb-2">Escalation Reactivated</h2>
              <p className="text-text-300 text-sm leading-relaxed max-w-[28ch]">
                Grievance marked as unresolved. Escalation sequence has been reactivated to writ petition.
              </p>
            </>
          )}
          <div className="mt-6 flex items-center gap-2 text-xs text-text-500 font-mono">
            <span className="w-1.5 h-1.5 bg-ember-500 rounded-full animate-ping" />
            Returning home...
          </div>
        </div>
      )}
    </div>
  );
}
