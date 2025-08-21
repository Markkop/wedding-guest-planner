import { redirect } from 'next/navigation';
import { safeGetUser } from '@/lib/auth/safe-stack';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await safeGetUser();
  
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/handler/sign-in');
  }
}
