"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M21.35 12.2c0-.7-.06-1.38-.18-2.04H12v3.86h5.24a4.48 4.48 0 0 1-1.94 2.94v2.5h3.14c1.84-1.69 2.9-4.18 2.9-7.26Z" />
      <path fill="#34A853" d="M12 21.7c2.62 0 4.82-.87 6.43-2.35l-3.14-2.5c-.87.58-1.98.93-3.29.93-2.53 0-4.67-1.71-5.44-4.01H3.32v2.58A9.7 9.7 0 0 0 12 21.7Z" />
      <path fill="#FBBC05" d="M6.56 13.77A5.83 5.83 0 0 1 6.26 12c0-.61.1-1.2.3-1.77V7.65H3.32A9.7 9.7 0 0 0 2.3 12c0 1.56.37 3.04 1.02 4.35l3.24-2.58Z" />
      <path fill="#EA4335" d="M12 6.22c1.43 0 2.71.49 3.72 1.45l2.79-2.79A9.34 9.34 0 0 0 12 2.3a9.7 9.7 0 0 0-8.68 5.35l3.24 2.58c.77-2.3 2.91-4.01 5.44-4.01Z" />
    </svg>
  );
}

export function GoogleLoginForm({
  callbackUrl,
  hasError,
}: {
  callbackUrl: string;
  hasError: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setClientError(null);

    try {
      const result = await signInWithGoogle(callbackUrl);
      if (result.error) {
        setClientError(result.error.message || "Google sign-in could not be started.");
        setIsLoading(false);
      }
    } catch {
      setClientError("Google sign-in could not be started. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Link href="/" className="mb-4 flex items-center gap-2 text-gray-900">
            <Calendar className="h-7 w-7 text-indigo-600" />
            <span className="text-xl font-bold">Guest Planner</span>
          </Link>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            Sign in with Google to manage your guest lists and collaborate with your event team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {(hasError || clientError) && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {clientError || "Google sign-in was not completed. Please try again."}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-3 bg-white"
            disabled={isLoading}
            onClick={handleGoogleLogin}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
            {isLoading ? "Connecting to Google..." : "Continue with Google"}
          </Button>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
            {" "}and acknowledge our{" "}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
