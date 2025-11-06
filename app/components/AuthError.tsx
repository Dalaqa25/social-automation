'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  if (!error) return null;

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
      <p className="font-medium">Authentication Required</p>
      <p className="mt-1">
        {message || 'Please sign in first using the "Sign In" button below before connecting your YouTube account.'}
      </p>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={null}>
      <AuthErrorContent />
    </Suspense>
  );
}

