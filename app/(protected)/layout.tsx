// app/(protected)/layout.tsx
import * as React from 'react';

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 p-4">
      {/* Skip to content for a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {/* Main grows, PageContainer handles width, padding & scroll */}

      <div id="main-content" className="w-full max-w-7xl">
        {children}
      </div>
    </div>
  );
}
