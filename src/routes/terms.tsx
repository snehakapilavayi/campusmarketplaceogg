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
          "The rules for using SwapSpace: eligibility, account registration, listing standards, prohibited items, moderation, the offline-payment model and liability.",
      },
      { property: "og:title", content: "Terms of Service — SwapSpace" },
      {
        property: "og:description",
        content: "Eligibility, listing rules, moderation, intellectual property and liability on SwapSpace.",
      },
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
      <p>Last updated: October 9, 2026</p>

      <LegalSection title="1. Acceptance of terms">
        <p>
          By accessing or using SwapSpace ("the Platform"), you agree to be bound by these Terms of Service
          ("Terms"). If you do not agree to all of these Terms, you may not access or use the Platform. We may update
          these Terms from time to time, and your continued use of the Platform constitutes acceptance of the updated
          Terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>SwapSpace is designed for college and university students. By creating an account, you represent and warrant that:</p>
        <LegalList
          items={[
            "You are currently enrolled at a recognised college or university in India (or are a verified incoming fresher).",
            "You are at least 18 years of age.",
            "The college email and ID you provide are genuinely yours and accurate.",
            "If you are a fresher awaiting your college ID, you may sign up with a Gmail address until you can verify.",
            "Accounts found to be fake, impersonating another student, or created by non-students may be suspended or removed without notice.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Account registration">
        <p>
          You may register using a valid college email or via Google OAuth. You are responsible for maintaining the
          confidentiality of your login credentials and for all activities that occur under your account. You agree to
          notify us immediately of any unauthorised use.
        </p>
      </LegalSection>

      <LegalSection title="4. How SwapSpace works">
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
            "We do not guarantee the quality, safety, or legality of items listed. All transactions are conducted at the sole risk of the parties involved.",
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Marketplace conduct and user responsibilities">
        <p>All items listed on SwapSpace must be legal to sell, accurately described, and must belong to the seller. When using SwapSpace, you agree to:</p>
        <LegalList
          items={[
            "List only items you have the right to sell, rent, or swap",
            "Provide accurate descriptions, prices, and photos for your listings",
            "Not list prohibited items (see Section 6)",
            "Communicate respectfully with other users in chat",
            "Not use SwapSpace to solicit transactions unrelated to buying/selling/renting/swapping campus items",
            "Not attempt to circumvent the verification system or create multiple/fake accounts",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Prohibited listings and activities">
        <p>The following are not allowed on SwapSpace:</p>
        <LegalList
          items={[
            "Stolen, counterfeit, or prohibited goods",
            "Illegal items or services (drugs, weapons, alcohol or other regulated substances, exam material/academic dishonesty aids, etc.)",
            "Items that violate any applicable law or your institution's policies",
            "Scam, fraudulent, misleading, deceptive, or duplicate listings, including fake listings",
            "Offensive, harassing, threatening, intimidating, or discriminatory content or behaviour toward other users",
            "Off-platform financial solicitations (e.g. loans, crypto schemes, MLM)",
            "Scraping, crawling, or using automated tools to access or extract data from the Platform",
            "Interfering with or disrupting the integrity or performance of the Platform",
            "Attempting to gain unauthorised access to any portion of the Platform, other accounts, or connected systems",
            "Any use of the Platform for a fraudulent, abusive, or unlawful purpose, or content violating applicable Indian law or your college's code of conduct",
          ]}
        />
        <p>
          Violations may result in listing removal, warnings, temporary suspension, or permanent account ban, at
          SwapSpace's discretion.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <p>
          All content, trademarks, logos, and design elements on SwapSpace are owned by or licensed to SwapSpace. You
          may not reproduce, distribute, or create derivative works from our content without prior written consent.
        </p>
        <p>
          By posting content (e.g., item photos, descriptions), you grant SwapSpace a non-exclusive, royalty-free
          licence to display and distribute that content on the Platform for the purpose of facilitating the
          marketplace.
        </p>
      </LegalSection>

      <LegalSection title="8. Events and requirements">
        <p>
          SwapSpace may host or list campus events and student requirements. Event organisers and requirement posters
          are solely responsible for the accuracy of the information they provide. SwapSpace does not endorse or
          guarantee any events or requirements listed on the Platform.
        </p>
      </LegalSection>

      <LegalSection title="9. Reporting and moderation">
        <LegalList
          items={[
            "Any listing can be reported (fake listing, wrong category, spam, offensive content, scam, duplicate listing).",
            "Reports are reviewed by admins via the moderation queue. We aim to act on genuine reports promptly, though response times may vary during the pilot phase.",
            "Repeated or serious violations may lead to permanent removal from the platform.",
          ]}
        />
      </LegalSection>

      <LegalSection title="10. No liability for transactions">
        <LegalList
          items={[
            "SwapSpace is not responsible for the quality, safety, legality, or condition of any item listed.",
            "SwapSpace is not responsible for any dispute, loss, damage, or fraud arising from a transaction between users, since all payment and exchange happens offline and outside our platform.",
            "Use SwapSpace at your own discretion — verify items in person before paying, and report suspicious activity immediately.",
          ]}
        />
      </LegalSection>

      <LegalSection title="11. Disclaimers">
        <p className="uppercase">
          The Platform is provided "as is" and "as available" without warranties of any kind, either express or
          implied. SwapSpace does not warrant that the Platform will be uninterrupted, error-free, or secure. Your use
          of the Platform is at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="12. Limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, SwapSpace and its founders, employees, and affiliates
          shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from
          your use of the Platform, including but not limited to loss of profits, data, or goodwill.
        </p>
      </LegalSection>

      <LegalSection title="13. Account suspension and termination">
        <p>
          We reserve the right to suspend or terminate your account at any time, with or without notice, if we
          reasonably believe you have violated these Terms, submitted fraudulent verification, or engaged in conduct
          that is harmful to the Platform or its users. You may also delete your account at any time.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes to these terms">
        <p>
          We may update these Terms as SwapSpace evolves (e.g. when payments, cart, or multi-campus features are
          added). Continued use after changes means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="15. Governing law">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out
          of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in
          Bhimavaram, Andhra Pradesh, India.
        </p>
      </LegalSection>

      <LegalSection title="16. Contact us">
        <p>
          If you have any questions about these Terms, please contact us at: <SupportEmailLink />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
