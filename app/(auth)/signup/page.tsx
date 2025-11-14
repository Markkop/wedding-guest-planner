import { SignUp } from '@clerk/nextjs';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const inviteCode = params.invite as string | undefined;
  
  // If there's an invite code, redirect to invite page after sign up
  const redirectUrl = inviteCode ? `/invite/${inviteCode}` : '/dashboard';
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp 
        afterSignUpUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
      />
    </div>
  );
}