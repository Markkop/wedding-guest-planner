"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { GuestTable } from "@/components/guest-table";
import { GuestGrid } from "@/components/guest-grid";
import { ViewToggle } from "@/components/view-toggle";
import { StatsCards } from "@/components/stats-cards";
import { OrganizationSelector } from "@/components/organization-selector";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { InviteManager } from "@/components/invite-manager";
import { SettingsDialog } from "@/components/settings-dialog";
import { ExportDialog } from "@/components/export-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import type { Organization } from "@/lib/types";
import { LoadingContent } from "@/components/ui/loading-spinner";
import { GuestProvider } from "@/lib/collaborative-guest-context";
import { CollaborationProvider } from "@/lib/collaboration-context";
import { OnlineUsersCompact } from "@/components/online-users-compact";
import { Chatbot } from "@/components/chatbot";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "grid">("table");

  const loadOrganizations = useCallback(async () => {
    try {
      const orgsResponse = await fetch("/api/organizations");
      const orgsData = await orgsResponse.json();

      if (orgsData.organizations && orgsData.organizations.length > 0) {
        setOrganization(orgsData.organizations[0]);
      }
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Log Clerk user ID for debugging
  useEffect(() => {
    if (user?.id) {
      console.log('🔑 Clerk User ID:', user.id);
      console.log('📧 User Email:', user.emailAddresses?.[0]?.emailAddress);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      loadOrganizations();
    }
  }, [user, isLoaded, loadOrganizations, router]);

  async function handleLogout() {
    try {
      await signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to logout");
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingContent text="Loading dashboard..." className="min-h-screen" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              Welcome, {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.emailAddresses?.[0]?.emailAddress || 'User'}
            </h1>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

          {/* Clerk User ID Debug Info */}
          {user?.id && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>🔑 Clerk User ID:</strong> <code className="bg-blue-100 px-1 rounded">{user.id}</code>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                <strong>📧 Email:</strong> {user.emailAddresses?.[0]?.emailAddress || 'N/A'}
              </p>
            </div>
          )}

          <OrganizationSelector onOrganizationSelect={setOrganization} />
        </div>
      </div>
    );
  }

  return (
    <CollaborationProvider organizationId={organization.id}>
      <GuestProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <OrganizationSwitcher
                  currentOrganization={organization}
                  onOrganizationChange={setOrganization}
                />
              </div>
              <div className="flex items-center gap-2">
                {/* Online users avatars */}
                <OnlineUsersCompact />

                {/* Admin controls */}
                {organization.role === "admin" && (
                  <>
                    <InviteManager
                      organization={organization}
                      onInviteRefresh={loadOrganizations}
                    />
                    <SettingsDialog
                      organization={organization}
                      onSettingsChange={loadOrganizations}
                    />
                    <ExportDialog
                      organization={organization}
                      onDataChange={loadOrganizations}
                    />
                  </>
                )}

                {/* Logout button */}
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>

            <StatsCards organization={organization} />

            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Guests</h2>
                <ViewToggle view={view} onViewChange={setView} />
              </div>

              {view === "table" ? (
                <GuestTable
                  organizationId={organization.id}
                  organization={organization}
                />
              ) : (
                <GuestGrid
                  organizationId={organization.id}
                  organization={organization}
                />
              )}
            </div>
          </div>

          {/* Chatbot */}
          <Chatbot organizationId={organization.id} />
        </div>
      </GuestProvider>
    </CollaborationProvider>
  );
}
