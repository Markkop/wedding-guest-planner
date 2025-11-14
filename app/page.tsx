"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocalGuestProvider } from "@/lib/local-guest-context";
import { GuestTable } from "@/components/guest-table";
import { GuestGrid } from "@/components/guest-grid";
import { StatsCards } from "@/components/stats-cards";
import { LoadingContent } from "@/components/ui/loading-spinner";
import {
  Sparkles,
  ArrowRight,
  Users,
  Calendar,
  UserPlus,
  Copy,
  GripVertical,
  Table,
  LayoutGrid,
  RefreshCw,
  Wifi,
  FileText,
  UtensilsCrossed,
  CheckCircle,
  Download,
  BarChart,
  MessageSquare,
  Mic,
  Image,
  Mail,
} from "lucide-react";
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
              <UserPlus className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Add/Edit/Delete Guests</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Copy className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Clone/Guest's +1</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <GripVertical className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Reorder Guests</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Table className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Table and Grid View</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <LayoutGrid className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">View Toggle</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <RefreshCw className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Live Updates</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Wifi className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Online Users</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Custom Fields</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Age Groups</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <UtensilsCrossed className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Food Preferences</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Confirmation Stages</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Download className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Import/Export</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <BarChart className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Statistics Cards</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">AI Chatbot</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mic className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Voice Input</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Image className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Image Support</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-5 w-5 text-indigo-600" />
              <span className="text-sm sm:text-base">Invite System</span>
            </div>
          </div>
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
