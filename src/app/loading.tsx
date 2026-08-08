import React from "react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] animate-fade-in">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-ink-600 border-t-ember-500 animate-spin" />
        <svg className="w-5 h-5 text-ember-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 2 7 7.5 7 12.5C7 16 9.5 19 12 19C14.5 19 17 16 17 12.5C17 10.8 16.2 9.5 15.3 8.3C15.6 10 15 11 14 11.5C14.3 9.5 13.5 7 12 2Z" />
        </svg>
      </div>
      <div className="mt-4 text-[10.5px] text-text-500 font-mono tracking-widest uppercase animate-pulse">
        Loading JanAgni...
      </div>
    </div>
  );
}
