'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingContent, InlineSpinner } from '@/components/ui/loading-spinner';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

interface OrganizationInfo {
  id: string;
  name: string;
  event_type: string;
  admin_name: string;
  member_count: number;
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const user = useUser();
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  const loadInviteInfo = useCallback(async () => {
    try {
      const { code } = await params;
      const response = await fetch(`/api/invite/${code}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired invite');
        return;
      }

      setOrganization(data.organization);
      setAlreadyMember(data.alreadyMember);
    } catch {
      setError('Failed to load invite information');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadInviteInfo();
  }, [loadInviteInfo]);

  const joinOrganization = async () => {
    const { code } = await params;
    if (!user) {
      // Redirect to sign up with invite code preserved
      router.push(`/signup?invite=${code}`);
      return;
    }

    setJoining(true);
    try {
      const response = await fetch(`/api/invite/${code}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join organization');
      }

      toast.success('Successfully joined the organization!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join organization');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingContent text="Loading invite..." className="min-h-screen" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700">Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyMember && organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-green-700">Already a Member</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You&apos;re already a member of <strong>{organization.name}</strong>
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            Join the organization and start planning together
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Organization:</span>
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {organization.name}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Event Type:</span>
              <Badge variant="secondary">{organization.event_type}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Admin:</span>
              <span>{organization.admin_name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Members:</span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {organization.member_count}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={joinOrganization} 
              disabled={joining} 
              className="w-full"
            >
              {joining ? (
                <>
                  <InlineSpinner size="sm" className="mr-2" />
                  {user ? 'Joining...' : 'Redirecting...'}
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  {user ? 'Join Organization' : 'Sign Up & Join'}
                </>
              )}
            </Button>
            
            {user && (
              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="outline" 
                className="w-full"
              >
                Maybe Later
              </Button>
            )}
          </div>

          {!user && (
            <div className="text-sm text-gray-600 text-center">
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto"
                onClick={async () => {
                  const { code } = await params;
                  router.push(`/login?invite=${code}`);
                }}
              >
                Sign in instead
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}