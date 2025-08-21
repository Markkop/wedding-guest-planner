import { StackServerApp } from "@stackframe/stack";
import { cookies } from 'next/headers';

// Create a safer Stack server app that handles cookie access errors
function createSafeStackServerApp() {
  if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
    throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID is not set");
  }
  if (!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY) {
    throw new Error("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is not set");
  }
  if (!process.env.STACK_SECRET_SERVER_KEY) {
    throw new Error("STACK_SECRET_SERVER_KEY is not set");
  }

  return new StackServerApp({
    tokenStore: "nextjs-cookie",
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
  });
}

let _stackServerApp: StackServerApp | null = null;

export function getStackServerApp(): StackServerApp {
  if (!_stackServerApp) {
    _stackServerApp = createSafeStackServerApp();
  }
  return _stackServerApp;
}

export async function safeGetUser() {
  try {
    // Check if cookies are available
    await cookies();
    
    // Try to get the user
    const stackApp = getStackServerApp();
    return await stackApp.getUser();
  } catch (error) {
    // Log the error for debugging but don't crash the app
    console.warn('Stack Auth error:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function safeRequireUser() {
  try {
    const stackApp = getStackServerApp();
    return await stackApp.getUser({ or: 'redirect' });
  } catch (error) {
    console.warn('Stack Auth requireUser error:', error instanceof Error ? error.message : error);
    throw new Error('Authentication required');
  }
}