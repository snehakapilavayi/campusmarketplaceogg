import { createFileRoute } from "@tanstack/react-router";
import { LegalList, LegalPage, LegalSection, SupportEmailLink } from "@/components/legal";
import { siteUrl } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — SwapSpace" },
      {
        name: "description",
        content:
          "The rules for using SwapSpace: eligibility, listing standards, prohibited items, moderation and the offline-payment model.",
      },
      { property: "og:title", content: "Terms of Service — SwapSpace" },
      { property: "og:description", content: "Eligibility, listing rules, moderation and liability on SwapSpace." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("/terms") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: siteUrl("/terms") }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage eyebrow="Terms of Service" title="SwapSpace — Terms of Service">
      <LegalSection title="1. Acceptance of terms">
        <p>
          By creating an account or using SwapSpace, you agree to these Terms. If you don't agree, please don't use the
          app.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <LegalList
          items={[
            "You must be a current student at institution (or a verified incoming fresher) to use SwapSpace.",
            "You must sign up with a valid college email address, or a Gmail address if you're a fresher awaiting your college ID.",
            "Accounts found to be fake, impersonating another student, or created by non-students may be suspended or removed without notice.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. How SwapSpace works">
        <LegalList
          items={[
            <>
              SwapSpace is a <strong className="font-semibold text-foreground">listing and discovery platform only</strong>. We connect
              buyers, sellers, and renters — we are not a party to any transaction.
            </>,
            <>
              <strong className="font-semibold text-foreground">All payments happen offline</strong>, directly between users (cash or
              UPI). SwapSpace does not process, hold, or guarantee any payment.
            </>,
            <>
              <strong className="font-semibold text-foreground">No cart or in-app checkout</strong> exists in the current version —
              items are discovered, discussed via chat, and settled in person on campus.
            </>,
            "Meetups for exchanging items/payment should happen in safe, public campus locations. SwapSpace does not verify or guarantee the safety of any specific meetup.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. User responsibilities">
        <p>When using SwapSpace, you agree to:</p>
        <LegalList
          items={[
            "List only items you have the right to sell, rent, or swap",
            "Provide accurate descriptions, prices, and photos for your listings",
            "Not list prohibited items (see Section 5)",
            "Communicate respectfully with other users in chat",
            "Not use SwapSpace to solicit transactions unrelated to buying/selling/renting/swapping campus items",
            "Not attempt to circumvent the verification system or create multiple/fake accounts",
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Prohibited listings and conduct">
        <p>The following are not allowed on SwapSpace:</p>
        <LegalList
          items={[
            "Illegal items or services (drugs, weapons, counterfeit goods, stolen property, exam material/academic dishonesty aids, etc.)",
            "Scam, fraudulent, or duplicate listings",
            "Offensive, harassing, or discriminatory content",
            "Off-platform financial solicitations (e.g. loans, crypto schemes, MLM)",
            "Any content violating applicable Indian law or your college's code of conduct",
          ]}
        />
        <p>
          Violations may result in listing removal, warnings, temporary suspension, or permanent account ban, at
          SwapSpace's discretion.
        </p>
      </LegalSection>

      <LegalSection title="6. Reporting and moderation">
        <LegalList
          items={[
            "Any listing can be reported (fake listing, wrong category, spam, offensive content, scam, duplicate listing).",
            "Reports are reviewed by admins via the moderation queue. We aim to act on genuine reports promptly, though response times may vary during the pilot phase.",
            "Repeated or serious violations may lead to permanent removal from the platform.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. No liability for transactions">
        <LegalList
          items={[
            "SwapSpace is not responsible for the quality, safety, legality, or condition of any item listed.",
            "SwapSpace is not responsible for any dispute, loss, damage, or fraud arising from a transaction between users, since all payment and exchange happens offline and outside our platform.",
            "Use SwapSpace at your own discretion — verify items in person before paying, and report suspicious activity immediately.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Account suspension and termination">
        <p>
          We may suspend or terminate accounts that violate these Terms, submit fraudulent verification, or pose a risk
          to other users. You may also delete your account at any time.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to these terms">
        <p>
          We may update these Terms as SwapSpace evolves (e.g. when payments, cart, or multi-campus features are added).
          Continued use after changes means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing law">
        <p>
          These Terms are governed by the laws of India. Any disputes will be handled in accordance with applicable
          Indian law.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Questions about these Terms: <SupportEmailLink />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
