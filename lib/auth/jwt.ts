import { cookies } from 'next/headers';

export type OrganizationSession = {
  organizationId: string;
};

export async function setOrganizationSession(organizationId: string) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  (await cookies()).set('current-organization', organizationId, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getOrganizationSession(): Promise<string | null> {
  const orgCookie = (await cookies()).get('current-organization')?.value;
  return orgCookie || null;
}

export async function clearOrganizationSession() {
  (await cookies()).set('current-organization', '', { expires: new Date(0) });
}