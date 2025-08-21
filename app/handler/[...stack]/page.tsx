import { StackHandler } from "@stackframe/stack";
import { getStackServerApp } from "@/lib/auth/safe-stack";

interface HandlerProps {
  params: Record<string, string | string[]>;
  searchParams: Record<string, string | string[]>;
}

export default function Handler(props: HandlerProps) {
  const stackServerApp = getStackServerApp();
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}