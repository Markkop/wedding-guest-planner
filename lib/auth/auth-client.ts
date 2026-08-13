"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: "/api/auth",
});

export const { useSession, signOut } = authClient;

export function signInWithGoogle(callbackURL: string) {
  return authClient.signIn.social({
    provider: "google",
    callbackURL,
    errorCallbackURL: "/login?error=oauth",
  });
}
