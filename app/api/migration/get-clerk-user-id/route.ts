import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({ 
      clerkUserId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    });
  } catch (error) {
    console.error('Error getting Clerk user ID:', error);
    return NextResponse.json({ error: 'Failed to get Clerk user ID' }, { status: 500 });
  }
}

