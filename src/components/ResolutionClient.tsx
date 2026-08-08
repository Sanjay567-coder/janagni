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
  const [showSuccess, setShowSuccess] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"fixed" | "unfixed" | null>(null);

  const handleFeedback = async (isFixed: boolean) => {
    setIsSubmitting(true);
    setFeedbackType(isFixed ? "fixed" : "unfixed");
    
    await submitResolutionFeedbackAction(complaint.complaintId, isFixed);
    
    // Simulate minor visual buffer for database validation
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        router.push(`/?id=${complaint.complaintId}`);
        router.refresh();
      }, 2000);
    }, 1500);
  };

  // 1. Loading State
  if (isSubmitting) {
    const isFixed = feedbackType === "fixed";
    return (
      <div className="flex flex-col flex-1 justify-center py-6 animate-fade-in">
        <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="relative w-12 h-12 mb-4">
            <span className="absolute inset-0 rounded-full border-4 border-ink-600" />
            <span className={`absolute inset-0 rounded-full border-4 border-t-transparent ${isFixed ? "border-sage-500" : "border-ember-600"} animate-spin`} />
          </div>
          <h2 className="font-fraunces text-[18px] font-semibold text-text-100 mb-1">
            {isFixed ? "Verifying Resolution..." : "Registering Grievance Failure..."}
          </h2>
          <p className="text-text-500 text-xs font-mono">Syncing Firestore registers...</p>
        </div>
      </div>
    );
  }

  // 2. Success/Escalated Final State
  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 justify-center py-6 animate-fade-in">
        <div className="bg-ink-800 border border-border rounded-custom p-8 text-center flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          {feedbackType === "fixed" ? (
            <>
              <div className="w-16 h-16 bg-sage-500/10 text-sage-500 border border-sage-500/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(127,166,135,0.15)]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="font-fraunces text-xl font-semibold mb-2">Resolution Confirmed</h2>
              <p className="text-text-300 text-[13.5px] leading-relaxed max-w-[28ch] font-sans">
                Grievance status finalized. Your verification has been recorded in the GCC audit ledger.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-ember-600/10 text-ember-600 border border-ember-600/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(228,87,46,0.15)]">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <h2 className="font-fraunces text-xl font-semibold mb-2">Writ Re-Escalated</h2>
              <p className="text-text-300 text-[13.5px] leading-relaxed max-w-[28ch] font-sans">
                Grievance marked as unresolved. Statutory escalation has been reactivated to writ petition.
              </p>
            </>
          )}
          <div className="mt-6 flex items-center gap-2 text-xs text-text-500 font-mono">
            <span className="w-1.5 h-1.5 bg-ember-500 rounded-full animate-ping" />
            Returning home...
          </div>
        </div>
      </div>
    );
  }

  // 3. Choice Form State
  return (
    <div className="flex flex-col flex-1 animate-fade-in justify-center py-6">
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="self-start text-xs text-text-500 hover:text-text-300 flex items-center gap-1.5 mb-6 font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember-500"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div className="bg-ink-800 border border-border rounded-custom p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sage-500/10 text-sage-500 text-[10.5px] font-mono border border-sage-500/20">
            Resolved State
          </span>
          <span className="font-mono text-[11px] text-text-500">{complaint.complaintId}</span>
        </div>

        <h1 className="font-fraunces text-2xl font-semibold mb-2">Verify Resolution</h1>
        <p className="text-text-300 text-[13.5px] leading-relaxed mb-6 font-sans">
          The municipal ward officer has marked this issue as resolved. Please inspect the site and confirm if the work has been completed satisfactorily.
        </p>

        {/* Details Card */}
        <div className="bg-ink-700/50 rounded-xl p-5 mb-6 border border-border">
          <div className="text-[10px] text-text-500 uppercase tracking-wider font-mono mb-1">Grievance Category</div>
          <div className="font-semibold text-text-100 text-[15px] font-fraunces mb-3">{complaint.category}</div>
          <div className="text-[10px] text-text-500 uppercase tracking-wider font-mono mb-1">Citizen Statement</div>
          <div className="text-text-300 text-[13.5px] leading-relaxed font-sans">{complaint.transcript}</div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleFeedback(true)}
            className="w-full py-4.5 bg-sage-500 text-ink-900 font-bold rounded-full text-[13.5px] flex items-center justify-center gap-2 hover:bg-sage-500/85 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 active:scale-[0.99] font-sans shadow-[0_4px_15px_rgba(127,166,135,0.25)]"
          >
            <Check className="w-4.5 h-4.5" />
            Confirm Resolved
          </button>
          
          <button
            onClick={() => handleFeedback(false)}
            className="w-full py-4.5 bg-ink-800 border-2 border-ember-600 text-ember-600 font-bold rounded-full text-[13.5px] flex items-center justify-center gap-2 hover:bg-ember-600/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 active:scale-[0.99] font-sans shadow-[0_4px_15px_rgba(228,87,46,0.15)]"
          >
            <X className="w-4.5 h-4.5" />
            Not Actually Fixed
          </button>
        </div>

        <div className="mt-4.5 text-[11px] text-text-500 text-center leading-relaxed font-sans max-w-[34ch] mx-auto">
          * Selecting <strong className="text-ember-600 font-semibold">&quot;Not Actually Fixed&quot;</strong> will immediately reactivate the Article 226 High Court Writ Petition, notifying the Zonal Commissioner of the failure.
        </div>
      </div>
    </div>
  );
}
