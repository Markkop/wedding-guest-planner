"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { LocalGuestProvider } from "@/lib/local-guest-context";
import { GuestTable } from "@/components/guest-table";
import { GuestGrid } from "@/components/guest-grid";
import { StatsCards } from "@/components/stats-cards";
import { LoadingContent } from "@/components/ui/loading-spinner";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

function LandingContent() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isPending) {
    return <LoadingContent text="Loading..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Guest Planner",
            url: "https://guests.markkop.dev",
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Web",
            description: "Collaborative wedding and event guest-list, RSVP, and dietary-preference organizer.",
          }).replace(/</g, "\\u003c"),
        }}
      />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">
                Guest Planner
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <Link href="/dashboard">
                  <Button className="text-sm">
                    <span className="hidden sm:inline">Go to Dashboard</span>
                    <span className="sm:hidden">Dashboard</span>
                    <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="text-sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" className="text-sm">
                      <span className="hidden sm:inline">Get Started Free</span>
                      <span className="sm:hidden">Sign Up</span>
                      <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Guest Management
            <br />
            <span className="text-indigo-600">Made Simple</span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Organize your special event with ease. Manage RSVPs, dietary
            preferences, seating arrangements, and more. Try the interactive
            demo below!
          </p>
        </div>
      </section>

      {/* Demo Section */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4">
          <LocalGuestProvider>
            {/* Stats Cards */}
            <div className="mb-4">
              <StatsCards
                organization={{
                  id: "demo-org-1",
                  name: "Sarah & Michael's Wedding",
                  invite_code: "DEMO2024",
                  admin_id: "demo-admin",
                  event_type: "wedding",
                  configuration: {
                    categories: [
                      {
                        id: "bride",
                        label: "Bride's Side",
                        initial: "B",
                        color: "#EC4899",
                      },
                      {
                        id: "groom",
                        label: "Groom's Side",
                        initial: "G",
                        color: "#3B82F6",
                      },
                      {
                        id: "mutual",
                        label: "Mutual Friends",
                        initial: "M",
                        color: "#10B981",
                      },
                    ],
                    ageGroups: {
                      enabled: true,
                      groups: [
                        { id: "adult", label: "Adult", minAge: 18 },
                        { id: "child", label: "Child (7-17)", minAge: 7 },
                        { id: "infant", label: "Infant (0-6)", minAge: 0 },
                      ],
                    },
                    foodPreferences: {
                      enabled: true,
                      allowMultiple: true,
                      options: [
                        { id: "none", label: "No restrictions" },
                        { id: "vegetarian", label: "Vegetarian" },
                        { id: "vegan", label: "Vegan" },
                        { id: "gluten_free", label: "Gluten-free" },
                        { id: "dairy_free", label: "Dairy-free" },
                      ],
                    },
                    confirmationStages: {
                      enabled: true,
                      stages: [
                        { id: "invited", label: "Invited", order: 1 },
                        { id: "confirmed", label: "Confirmed", order: 2 },
                        { id: "declined", label: "Declined", order: 3 },
                      ],
                    },
                  },
                  created_at: new Date("2024-01-01"),
                  updated_at: new Date(),
                  role: "admin",
                }}
              />
            </div>

            {/* Original Guest Table */}
            <div className="mb-12">
              <GuestTable
                organizationId="demo-org-1"
                persistColumnSettings={false}
                organization={{
                  id: "demo-org-1",
                  name: "Sarah & Michael's Wedding",
                  invite_code: "DEMO2024",
                  admin_id: "demo-admin",
                  event_type: "wedding",
                  configuration: {
                    categories: [
                      {
                        id: "bride",
                        label: "Bride's Side",
                        initial: "B",
                        color: "#EC4899",
                      },
                      {
                        id: "groom",
                        label: "Groom's Side",
                        initial: "G",
                        color: "#3B82F6",
                      },
                      {
                        id: "mutual",
                        label: "Mutual Friends",
                        initial: "M",
                        color: "#10B981",
                      },
                    ],
                    ageGroups: {
                      enabled: true,
                      groups: [
                        { id: "adult", label: "Adult", minAge: 18 },
                        { id: "child", label: "Child (7-17)", minAge: 7 },
                        { id: "infant", label: "Infant (0-6)", minAge: 0 },
                      ],
                    },
                    foodPreferences: {
                      enabled: true,
                      allowMultiple: true,
                      options: [
                        { id: "none", label: "No restrictions" },
                        { id: "vegetarian", label: "Vegetarian" },
                        { id: "vegan", label: "Vegan" },
                        { id: "gluten_free", label: "Gluten-free" },
                        { id: "dairy_free", label: "Dairy-free" },
                      ],
                    },
                    confirmationStages: {
                      enabled: true,
                      stages: [
                        { id: "invited", label: "Invited", order: 1 },
                        { id: "confirmed", label: "Confirmed", order: 2 },
                        { id: "declined", label: "Declined", order: 3 },
                      ],
                    },
                  },
                  created_at: new Date("2024-01-01"),
                  updated_at: new Date(),
                  role: "admin",
                }}
              />
            </div>

            {/* Guest Grid View */}
            <div className="mb-12">
              <GuestGrid
                organizationId="demo-org-1"
                organization={{
                  id: "demo-org-1",
                  name: "Sarah & Michael's Wedding",
                  invite_code: "DEMO2024",
                  admin_id: "demo-admin",
                  event_type: "wedding",
                  configuration: {
                    categories: [
                      {
                        id: "bride",
                        label: "Bride's Side",
                        initial: "B",
                        color: "#EC4899",
                      },
                      {
                        id: "groom",
                        label: "Groom's Side",
                        initial: "G",
                        color: "#3B82F6",
                      },
                      {
                        id: "mutual",
                        label: "Mutual Friends",
                        initial: "M",
                        color: "#10B981",
                      },
                    ],
                    ageGroups: {
                      enabled: true,
                      groups: [
                        { id: "adult", label: "Adult", minAge: 18 },
                        { id: "child", label: "Child (7-17)", minAge: 7 },
                        { id: "infant", label: "Infant (0-6)", minAge: 0 },
                      ],
                    },
                    foodPreferences: {
                      enabled: true,
                      allowMultiple: true,
                      options: [
                        { id: "none", label: "No restrictions" },
                        { id: "vegetarian", label: "Vegetarian" },
                        { id: "vegan", label: "Vegan" },
                        { id: "gluten_free", label: "Gluten-free" },
                        { id: "dairy_free", label: "Dairy-free" },
                      ],
                    },
                    confirmationStages: {
                      enabled: true,
                      stages: [
                        { id: "invited", label: "Invited", order: 1 },
                        { id: "confirmed", label: "Confirmed", order: 2 },
                        { id: "declined", label: "Declined", order: 3 },
                      ],
                    },
                  },
                  created_at: new Date("2024-01-01"),
                  updated_at: new Date(),
                  role: "admin",
                }}
              />
            </div>
          </LocalGuestProvider>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to plan your event?
          </h2>
          <p className="text-xl text-indigo-100 mb-4">
            Create your free account and start managing your guest list in
            minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-6 sm:px-8 w-full sm:w-auto"
                >
                  Go to Your Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="px-6 sm:px-8 w-full sm:w-auto"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6 sm:px-8 w-full sm:w-auto text-white border-white hover:bg-white hover:text-indigo-600"
                  >
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-gray-400 sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} Guest Planner. Made for special events.</p>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/data-deletion" className="hover:text-white">Data deletion</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <LandingContent />;
}
