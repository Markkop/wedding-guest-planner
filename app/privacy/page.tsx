import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Guest Planner collects, uses, stores, and shares account and event-planning data.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy", url: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This policy explains how Guest Planner handles information when you organize an event, collaborate with others, or sign in with Google."
    >
      <section>
        <h2>Information we collect</h2>
        <ul className="mt-3 space-y-2">
          <li>Account information provided by Google, including your name, email address, profile image, and provider account identifier.</li>
          <li>Event and guest-list content, including names, RSVP stages, age groups, dietary preferences, custom fields, notes, organization memberships, and invitation codes.</li>
          <li>Files or content you choose to import, export, paste, record, or upload, including images and audio submitted to assisted features.</li>
          <li>Essential session cookies and technical information needed for authentication, security, diagnostics, and reliable operation.</li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <ul className="mt-3 space-y-2">
          <li>Authenticate your account and protect private workspaces.</li>
          <li>Store, synchronize, import, export, and collaboratively update guest lists.</li>
          <li>Provide AI-assisted chat, image analysis, and audio transcription when you choose to use those features.</li>
          <li>Prevent abuse, investigate errors, maintain security, and improve service reliability.</li>
        </ul>
      </section>

      <section>
        <h2>Google sign-in</h2>
        <p className="mt-3">
          Google is used only to authenticate your account with the basic OpenID, email, and profile scopes. Guest Planner does not request access to Gmail, Google Drive, contacts, calendars, or other Google account content. Google handles information under its own privacy policy.
        </p>
      </section>

      <section>
        <h2>Collaboration and third-party processing</h2>
        <p className="mt-3">
          People who join the same organization can view and modify the guest information available in that workspace. When assisted features are used, relevant prompts, guest context, images, or audio may be sent to OpenAI for processing. Authentication is handled by Better Auth, and application data is stored in PostgreSQL on infrastructure used to operate the service. We do not sell personal information.
        </p>
      </section>

      <section>
        <h2>Your responsibilities</h2>
        <p className="mt-3">
          Guest lists can contain information about other people. You are responsible for having an appropriate reason or permission to add, share, and process that information and for limiting workspace invitations to people who should have access.
        </p>
      </section>

      <section>
        <h2>Retention, security, and your choices</h2>
        <p className="mt-3">
          We retain account and workspace data while it is needed to provide the service or satisfy legitimate operational and legal needs. We use reasonable safeguards, but no system can guarantee absolute security. You may request access, correction, export, or deletion by following our <Link href="/data-deletion">data deletion instructions</Link>.
        </p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p className="mt-3">
          We may update this policy as the service changes. The revision date above will identify the current version. Questions can be sent to <a href="mailto:contact@markkop.dev">contact@markkop.dev</a>.
        </p>
      </section>
    </LegalPage>
  );
}
