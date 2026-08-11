import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection, LegalSubheading, SupportEmailLink } from "@/components/legal";
import { siteUrl } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SwapSpace" },
      {
        name: "description",
        content:
          "How SwapSpace collects, uses and protects student data on the campus marketplace. No payment data, no advertising, no selling your information.",
      },
      { property: "og:title", content: "Privacy Policy — SwapSpace" },
      { property: "og:description", content: "What we collect, why, and how your student data is handled." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("/privacy") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: siteUrl("/privacy") }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage eyebrow="Privacy Policy" title="SwapSpace — Privacy Policy">
      <LegalSection title="1. Who we are">
        <p>
          SwapSpace is a campus-exclusive marketplace app for institution students to buy, sell, rent, and swap items
          with verified fellow students. This policy explains what information we collect, why, and how it's handled.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <LegalSubheading>a) Account information</LegalSubheading>
        <LegalList
          items={[
            "College email address (used for verification) or Gmail address (for freshers without a college ID yet)",
            "Name",
            "Password (stored encrypted, never in plain text)",
            "Optional profile details (hostel/branch/year, if you choose to add them)",
          ]}
        />

        <LegalSubheading>b) Listing information</LegalSubheading>
        <LegalList
          items={[
            "Item title, description, category, price, photos",
            "Rent vs. sale status",
            "Location context you provide (e.g. hostel block, campus area)",
          ]}
        />

        <LegalSubheading>c) Activity and usage data</LegalSubheading>
        <LegalList
          items={[
            "Messages sent through SwapSpace chat (for matching buyers/sellers and for moderation if reported)",
            "Reports you file or that are filed against your listings/account",
            "Wishlist and saved items",
            "Notification preferences",
            "Basic usage data (pages visited, actions taken) for improving the app",
          ]}
        />

        <LegalSubheading>d) Information we do NOT collect</LegalSubheading>
        <LegalList
          items={[
            "We do not process or store payment information — all payments happen offline, directly between students (cash or UPI), and SwapSpace never sees or touches this money.",
            "We do not access your device contacts, location tracking (GPS), or camera roll beyond photos you actively choose to upload.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <LegalList
          items={[
            "To verify you're a genuine student before your account/listings go live",
            "To display your listings to other verified students",
            "To enable chat between buyers and sellers",
            "To send notifications (marketplace activity, college events, system updates) — you can control these in-app",
            "To review and act on reports (fake listings, spam, scams, offensive content, duplicates)",
            "To improve the app (aggregated, non-identifying usage patterns)",
          ]}
        />
        <p>
          We do <strong className="font-semibold text-foreground">not</strong> sell your data to third parties, use it
          for advertising, or share it outside SwapSpace except where required by law or to keep the platform safe (see
          Section 5).
        </p>
      </LegalSection>

      <LegalSection title="4. Verification process">
        <p>
          When you sign up with a college email, your account is reviewed before your listings go live, and you receive
          a "Verified Student" badge. Freshers without a college ID yet may sign up with a Gmail address and get instant
          access; verification status may be upgraded later. We may ask for additional proof (e.g. college ID photo) if
          we suspect an account is not a genuine student — this is used only for verification and is not publicly shown.
        </p>
      </LegalSection>

      <LegalSection title="5. When we may share information">
        <LegalList
          items={[
            "With admins/moderators internally, to review reports or resolve disputes",
            "If required by law, legal process, or to protect the safety of users (e.g. a scam or safety complaint escalated to college authorities)",
            "We do not share your data with advertisers or external companies.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Data retention">
        <LegalList
          items={[
            "Account and listing data is retained while your account is active.",
            "If you delete your account, your listings are removed from public view; chat history may be retained briefly for dispute resolution/moderation purposes before deletion.",
            "Reported content may be retained longer for moderation records.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Your rights and choices">
        <LegalList
          items={[
            "You can edit or delete your listings at any time.",
            "You can request account deletion by contacting us (see Section 9).",
            "You can control which notification types you receive.",
            "You can request a copy of the data associated with your account.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Data security">
        <p>
          We take reasonable technical measures (encrypted passwords, access controls on the admin dashboard) to protect
          your data. No system is 100% secure, and you should avoid sharing sensitive personal information (like OTPs,
          bank details, or passwords) with other users in chat — SwapSpace will never ask for these.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact us">
        <p>
          Questions about this policy or your data: <SupportEmailLink />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
