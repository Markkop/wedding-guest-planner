import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing access to and use of Guest Planner.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of Service", url: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="By accessing or using Guest Planner, you agree to these terms. If you do not agree, do not use the service."
    >
      <section>
        <h2>The service</h2>
        <p className="mt-3">
          Guest Planner helps people organize event guest lists, RSVP stages, dietary preferences, custom information, and collaboration. Features may change, be interrupted, or be discontinued as the product evolves.
        </p>
      </section>

      <section>
        <h2>Accounts and access</h2>
        <p className="mt-3">
          You must provide accurate account information, keep your Google account secure, and take responsibility for activity performed through your account. Organization administrators control invitation links and are responsible for granting access appropriately.
        </p>
      </section>

      <section>
        <h2>Guest information and collaboration</h2>
        <p className="mt-3">
          You retain responsibility for information you submit. You must have the rights, permission, or other appropriate basis to upload and share personal information about guests. Other members of an organization may view, export, change, or delete shared workspace content.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul className="mt-3 space-y-2">
          <li>Do not use the service for unlawful, fraudulent, abusive, invasive, or harmful activity.</li>
          <li>Do not access another person’s account or workspace without permission.</li>
          <li>Do not interfere with security, availability, infrastructure, or other users.</li>
          <li>Do not upload content that infringes rights or distribute malicious code.</li>
        </ul>
      </section>

      <section>
        <h2>AI-assisted features</h2>
        <p className="mt-3">
          Automated suggestions, transcriptions, and image analysis can be incomplete or incorrect. Review AI-generated output before relying on it or applying changes to a guest list. These features are provided as planning aids and not as legal, medical, dietary, or professional advice.
        </p>
      </section>

      <section>
        <h2>Availability and liability</h2>
        <p className="mt-3">
          The service is provided “as is” and “as available” without a guarantee of uninterrupted operation or preservation of every item of data. To the extent allowed by law, the service’s operators are not liable for indirect, incidental, or consequential losses arising from use of the service.
        </p>
      </section>

      <section>
        <h2>Suspension, termination, and changes</h2>
        <p className="mt-3">
          Access may be limited or terminated for abuse, security risks, legal requirements, or violations of these terms. You may stop using the service or request deletion at any time. Updated terms will be posted here with a revised date, and continued use after an update means you accept the revised terms.
        </p>
      </section>

      <section>
        <h2>Privacy and contact</h2>
        <p className="mt-3">
          Our <Link href="/privacy">Privacy Policy</Link> describes how information is handled. Questions about these terms can be sent to <a href="mailto:contact@markkop.dev">contact@markkop.dev</a>.
        </p>
      </section>
    </LegalPage>
  );
}
