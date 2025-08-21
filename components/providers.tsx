"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/lib/auth/stack-client";
import { Suspense } from "react";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StackProvider app={stackClientApp}>
        <StackTheme>
          {children}
        </StackTheme>
      </StackProvider>
    </Suspense>
  );
}