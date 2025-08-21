import { StackServerApp } from "@stackframe/stack";

if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID is not set");
}
if (!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY) {
  throw new Error("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is not set");
}
if (!process.env.STACK_SECRET_SERVER_KEY) {
  throw new Error("STACK_SECRET_SERVER_KEY is not set");
}

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
});

// Helper function to safely get user without throwing errors
export async function safeGetUser() {
  try {
    return await stackServerApp.getUser();
  } catch (error) {
    console.warn('Stack Auth getUser error:', error);
    return null;
  }
}