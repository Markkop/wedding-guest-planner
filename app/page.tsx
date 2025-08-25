"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocalGuestProvider } from "@/lib/local-guest-context";
import { GuestTable } from "@/components/guest-table";
import { StatsCards } from "@/components/stats-cards";
import { LoadingContent } from "@/components/ui/loading-spinner";
import { Sparkles, ArrowRight, Users, Calendar, Settings } from "lucide-react";
import Link from "next/link";

function LandingContent() {
  const user = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingContent text="Loading..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  <Link href="/handler/sign-in">
                    <Button variant="outline" size="sm" className="text-sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/handler/sign-up">
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
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="mr-1 h-3 w-3" />
            Interactive Demo Below
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Wedding Guest Management
            <br />
            <span className="text-indigo-600">Made Simple</span>
          </h1>

          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            Organize your special event with ease. Manage RSVPs, dietary
            preferences, seating arrangements, and more. Try the interactive
            demo below!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Unlimited Guests</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Settings className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Drag & Drop</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Real-time Updates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4">
          <LocalGuestProvider>
            {/* Demo Instructions */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                🎯 Try These Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div className="text-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <strong>Drag & Drop</strong>
                  <p className="text-gray-600">Reorder guests</p>
                </div>
                <div className="text-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <strong>Edit Names</strong>
                  <p className="text-gray-600">Click edit icon</p>
                </div>
                <div className="text-center">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mx-auto mb-2"></div>
                  <strong>Categories</strong>
                  <p className="text-gray-600">Click B/G/M buttons</p>
                </div>
                <div className="text-center">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mx-auto mb-2"></div>
                  <strong>Food Prefs</strong>
                  <p className="text-gray-600">Click food icons</p>
                </div>
                <div className="text-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full mx-auto mb-2"></div>
                  <strong>Add Guests</strong>
                  <p className="text-gray-600">Type name below</p>
                </div>
                <div className="text-center">
                  <div className="h-2 w-2 bg-gray-500 rounded-full mx-auto mb-2"></div>
                  <strong>Settings</strong>
                  <p className="text-gray-600">Toggle columns</p>
                </div>
              </div>
            </div>

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

      {/* Pricing Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <div className="text-3xl font-bold mb-4">$0</div>
                <p className="text-gray-600 mb-6">Perfect for small events</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Up to 30 guests
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Up to 10 AI messages/day
                </li>
                <li className="flex items-center">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-gray-500">Invite collaborators</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Drag & drop reordering
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Export guest lists
                </li>
              </ul>
              <Link href="/handler/sign-up">
                <Button className="w-full" variant="outline">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Plus Plan */}
            <div className="border-2 border-indigo-600 rounded-lg p-6 bg-white relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-indigo-600">Most Popular</Badge>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Plus</h3>
                <div className="text-3xl font-bold mb-1">
                  $10 <span className="text-sm font-normal text-gray-600">USD</span>
                </div>
                <div className="text-lg font-semibold mb-4">
                  R$50 <span className="text-sm font-normal text-gray-600">BRL</span>
                </div>
                <p className="text-gray-600 mb-6">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Up to 200 guests
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Up to 50 AI messages/day
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Invite collaborators
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Advanced guest management
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Priority support
                </li>
              </ul>
              <Link href="/handler/sign-up">
                <Button className="w-full">
                  Start Plus Plan
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <div className="text-3xl font-bold mb-1">
                  $30 <span className="text-sm font-normal text-gray-600">USD</span>
                </div>
                <div className="text-lg font-semibold mb-4">
                  R$150 <span className="text-sm font-normal text-gray-600">BRL</span>
                </div>
                <p className="text-gray-600 mb-6">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Up to 500 guests
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Up to 100 AI messages/day
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited collaborators
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Feature requests
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  White-glove support
                </li>
              </ul>
              <Link href="/handler/sign-up">
                <Button className="w-full" variant="outline">
                  Start Pro Plan
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center mt-8 text-sm text-gray-600">
            <p>
              * Note: Voice transcription doesn&apos;t count as an AI request, but becomes unavailable once you reach your AI message limit.
            </p>
            <p className="mt-2">
              All plans include drag & drop reordering, export functionality, and real-time collaboration.
            </p>
          </div>
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
                <Link href="/handler/sign-up">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="px-6 sm:px-8 w-full sm:w-auto"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/handler/sign-in">
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
        <div className="mx-auto max-w-7xl px-4 text-center text-gray-400">
          <p>&copy; 2024 Guest Planner. Made for special events.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <LandingContent />;
}
