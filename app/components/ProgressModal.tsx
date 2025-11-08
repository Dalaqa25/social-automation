"use client";

import { useEffect } from "react";

type StepStatus = "pending" | "processing" | "completed" | "error";

interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: Step[];
  currentStep: number;
  message?: string;
  result?: {
    youtubeUrl?: string;
    videoId?: string;
    error?: string;
  };
}

export default function ProgressModal({
  isOpen,
  onClose,
  steps,
  currentStep,
  message,
  result,
}: ProgressModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isComplete = currentStep >= steps.length;
  const hasError = result?.error || steps.some((s) => s.status === "error");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isComplete && !hasError ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-purple-300/40 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-purple-400/30 dark:bg-gray-900/95">
        {/* Header */}
        <div className="border-b border-gray-200/50 px-6 py-4 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Automation Progress
            </h2>
            {(isComplete || hasError) && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Status Message */}
          {message && (
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isPast = index < currentStep;
              const isFuture = index > currentStep;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  {/* Step Icon */}
                  <div className="flex-shrink-0">
                    {step.status === "completed" ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : step.status === "error" ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="flex-1 pt-2">
                    <p
                      className={`text-sm font-medium ${
                        isActive
                          ? "text-purple-600 dark:text-purple-400"
                          : isPast
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result */}
          {isComplete && result && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              {result.youtubeUrl ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-300">
                    ✅ Successfully uploaded to YouTube!
                  </p>
                  <a
                    href={result.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 underline hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    View on YouTube →
                  </a>
                </div>
              ) : result.error ? (
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  ❌ Error: {result.error}
                </p>
              ) : null}
            </div>
          )}

          {hasError && result?.error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                ❌ {result.error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

