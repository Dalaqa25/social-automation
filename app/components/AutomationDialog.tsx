"use client";

import { useEffect, useState } from "react";

interface AutomationDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  variant?: "info" | "success" | "error";
}

export default function AutomationDialog({ open, title, message, onClose, variant = "info" }: AutomationDialogProps) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      requestAnimationFrame(() => setIsVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      const timeout = setTimeout(() => setIsMounted(false), 200);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="automation-dialog-title">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative w-full max-w-lg rounded-2xl border-5 border-purple-300/40 bg-white shadow-2xl dark:border-purple-400/30 transition-all duration-200 ease-out transform ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-1 scale-95"
        }`}
      >
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {variant === "error" ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10">
                  <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                  </svg>
                </span>
              ) : variant === "success" ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ) : null}
              <h3 id="automation-dialog-title" className="text-lg font-semibold">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1"
              aria-label="Close"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm">{message}</p>
        </div>
        <div className="px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="m-1 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-600 to-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-md cursor-pointer transition duration-200 ease-out hover:opacity-95 hover:shadow-lg hover:scale-[1.02] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

