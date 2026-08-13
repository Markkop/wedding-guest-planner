import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "How to request deletion of your Guest Planner account and associated data.",
  alternates: { canonical: "/data-deletion" },
  openGraph: { title: "Data Deletion", url: "/data-deletion" },
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Data Deletion"
      description="You can request deletion of your Guest Planner account and associated personal information by email."
    >
      <section>
        <h2>Submit a request</h2>
        <p className="mt-3">
          Email <a href="mailto:contact@markkop.dev?subject=Guest%20Planner%20data%20deletion">contact@markkop.dev</a> from the Google email address connected to your Guest Planner account. Use the subject “Guest Planner data deletion” and identify the organizations you own or belong to.
        </p>
      </section>

      <section>
        <h2>Verification and organization data</h2>
        <p className="mt-3">
          We may ask for reasonable information to confirm that you control the account. If you administer an organization, we will clarify whether its guest list should be deleted or transferred to another authorized member before completing the request. Removing your membership does not automatically delete information other members are entitled to retain in a shared workspace.
        </p>
      </section>

      <section>
        <h2>What deletion covers</h2>
        <p className="mt-3">
          Once verified, the request can cover your account profile, authentication sessions, organization memberships, and application content that should be removed with your account. Limited records may be retained when reasonably necessary for security, legal compliance, fraud prevention, backup rotation, or resolving disputes.
        </p>
      </section>

      <section>
        <h2>Before requesting deletion</h2>
        <p className="mt-3">
          Export any guest lists you need before requesting deletion. Completed deletion may be irreversible. For more information, read the <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
