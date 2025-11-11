"use client";

interface AutomationDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function AutomationDialog({ open, title, message, onClose }: AutomationDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="automation-dialog-title">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 id="automation-dialog-title" className="text-base font-semibold">{title}</h3>
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
        <div className="px-5 py-4">
          <p className="text-sm">{message}</p>
        </div>
        <div className="px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

