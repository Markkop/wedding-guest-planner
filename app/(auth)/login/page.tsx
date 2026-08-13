import type { Metadata } from "next";
import { GoogleLoginForm } from "@/components/auth/google-login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Guest Planner with Google.",
  robots: { index: false, follow: false },
};

function safeCallbackUrl(value: string | undefined, invite: string | undefined) {
  if (invite && /^[A-Za-z0-9_-]+$/.test(invite)) {
    return `/invite/${invite}`;
  }
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined,
    typeof params.invite === "string" ? params.invite : undefined,
  );

  return (
    <GoogleLoginForm
      callbackUrl={callbackUrl}
      hasError={typeof params.error === "string"}
    />
  );
}
