"use client";
import { StackClientApp } from "@stackframe/stack";

if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID is not set");
}
if (!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY) {
  throw new Error("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is not set");
}

let _stackClientApp: StackClientApp | null = null;

export function getStackClientApp(): StackClientApp {
  if (!_stackClientApp) {
    _stackClientApp = new StackClientApp({
      projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
      publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
      tokenStore: "memory", // Use memory store instead of cookie store for better reliability
    });
  }
  return _stackClientApp;
}

export const stackClientApp = getStackClientApp();

// Safe client-side user retrieval
export async function safeGetClientUser() {
  try {
    const app = getStackClientApp();
    return await app.getUser();
  } catch (error) {
    console.warn('Stack Auth client getUser error:', error);
    return null;
  }
}