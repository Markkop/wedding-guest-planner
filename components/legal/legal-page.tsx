import Link from "next/link";
import { Calendar } from "lucide-react";

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Guest Planner
          </Link>
          <Link href="/login" className="text-sm text-indigo-700 hover:underline">Sign in</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-sm text-gray-500">Last updated: August 13, 2026</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-gray-600">{description}</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-gray-700 [&_a]:text-indigo-700 [&_a]:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_li]:ml-5 [&_ul]:list-disc">
          {children}
        </div>
      </main>

      <footer className="border-t bg-white px-5 py-6 text-center text-sm text-gray-500">
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/">Home</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-deletion">Data deletion</Link>
        </nav>
      </footer>
    </div>
  );
}
