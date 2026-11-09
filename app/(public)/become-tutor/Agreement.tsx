"use client";

import { ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/constants";

/** Format a date as MM/DD/YYYY (the format the agreement specifies). */
export function formatAgreementDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export const AGREEMENT_CHECKBOX_LABEL =
  "I have carefully read and understood all the Terms and Conditions stated in this Agreement. I voluntarily agree to follow these policies and accept the terms and conditions of Bright Path Home Tuition.";

function SectionHeading({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h4 className="mt-6 flex items-baseline gap-2 text-base font-bold text-foreground">
      <span className="text-primary">{n}.</span>
      <span>{children}</span>
    </h4>
  );
}

/**
 * The full Bright Path Home Tuition Teacher Application Agreement, rendered as a
 * formal document. The teacher name and date are injected dynamically — never
 * hardcoded — so the paper reflects whatever the applicant entered in Step 1.
 */
export function AgreementDocument({
  teacherName,
  date,
}: {
  teacherName: string;
  date: string;
}) {
  const name = teacherName.trim() || "—";
  return (
    <article className="rounded-xl border border-border bg-background">
      {/* Letterhead */}
      <header className="border-b border-border px-5 py-5 text-center sm:px-8">
        <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {SITE.fullName}
        </p>
        <h3 className="mt-2 text-xl font-bold text-foreground">
          Teacher Application Terms and Conditions
        </h3>
      </header>

      <div className="px-5 py-6 text-sm leading-relaxed text-muted-foreground sm:px-8">
        {/* Parties */}
        <dl className="grid gap-2 rounded-lg bg-muted/60 p-4 text-foreground sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date
            </dt>
            <dd className="font-medium">{date}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Company
            </dt>
            <dd className="font-medium">{SITE.fullName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Teacher Name
            </dt>
            <dd className="font-medium">{name}</dd>
          </div>
        </dl>

        <p className="mt-5">This agreement is made between the Applicant named above and {SITE.fullName}.</p>

        <SectionHeading n={1}>Declaration of Information Accuracy</SectionHeading>
        <p className="mt-2">
          The Applicant hereby declares that all information provided in this application is true,
          accurate, and correct.
        </p>
        <p className="mt-2">
          The Applicant understands that any false, misleading, or incomplete statements may result
          in the immediate rejection of this application or termination of any subsequent agreement.
        </p>

        <SectionHeading n={2}>Teaching Responsibilities</SectionHeading>
        <p className="mt-2">The Applicant agrees to:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Provide high-quality teaching services tailored to the specific needs of the student(s).</li>
          <li>Be punctual and professional in all interactions with students, parents, and the Company.</li>
          <li>Maintain the confidentiality of all student-related information, including personal details and academic progress.</li>
          <li>Report student progress to the Company or parents as required and maintain clear communication.</li>
        </ul>

        <SectionHeading n={3}>Commission and Payment Terms</SectionHeading>
        <p className="mt-2">
          The Applicant agrees to pay a commission of{" "}
          <strong className="rounded bg-primary/10 px-1 font-semibold text-foreground">
            30% of the first month&apos;s tuition fee + NPR 200 (30% + 200)
          </strong>{" "}
          to the Company.
        </p>
        <p className="mt-2">
          This payment is for the facilitation service of connecting the teacher with the client.
        </p>
        <p className="mt-2">
          The Applicant acknowledges their status as an independent service provider and accepts sole
          responsibility for all applicable personal tax obligations on earnings from tuition.
        </p>

        <SectionHeading n={4}>Legal Enforcement and Collection</SectionHeading>
        <p className="mt-2">
          In the event that the Applicant receives a tuition placement facilitated by the Company but
          fails to pay the agreed commission within the stipulated timeframe, the Company reserves the
          right to:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Pursue legal action for recovery of the outstanding amount, plus applicable interest and legal costs.</li>
          <li>Report the matter to relevant authorities and credit agencies as permitted under Nepalese law.</li>
          <li>Seek compensation for any damages incurred due to non-payment.</li>
          <li>Terminate the Applicant&apos;s access to future tuition opportunities through the Company&apos;s platform.</li>
        </ul>
        <p className="mt-2">
          The Applicant acknowledges that these terms constitute a legally binding agreement under the
          laws of Nepal, subject to applicable legal requirements. Any disputes shall be resolved in the
          competent courts of Nepal.
        </p>

        <SectionHeading n={5}>Confidentiality and Non-Disclosure</SectionHeading>
        <p className="mt-2">
          The Applicant agrees not to disclose any confidential information regarding the Company, its
          business operations, students, or parents to any third party without prior written consent
          from the Company, except where disclosure is required by law.
        </p>
        <p className="mt-2">
          This provision shall be interpreted in accordance with applicable Nepalese laws, including the
          Individual Privacy Act, 2018 (2075).
        </p>

        <SectionHeading n={6}>Code of Conduct and Liability</SectionHeading>
        <p className="mt-2">
          The Applicant agrees to conduct themselves in a lawful, ethical, and professional manner at
          all times during teaching assignments.
        </p>
        <p className="mt-2">
          The Applicant agrees to abide by the Company&apos;s code of conduct, which includes:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Maintaining a respectful, safe, and appropriate learning environment for students.</li>
          <li>Avoiding conflicts of interest or private agreements with clients introduced by the Company to circumvent commission payments.</li>
        </ul>
        <p className="mt-2">
          Any crime, illegal activity, or professional misconduct committed by the Applicant shall be
          their own responsibility. The Company acts solely as a facilitator and shall not be liable for
          the Applicant&apos;s independent actions except to the extent required by applicable law.
        </p>

        <SectionHeading n={7}>Demo Class Policy</SectionHeading>
        <p className="mt-2">
          The Applicant agrees to provide short demo classes for a maximum period of seven (7) days,
          depending on the client&apos;s requirements.
        </p>
        <p className="mt-2">
          Demo sessions shall be brief and intended solely to evaluate the teacher&apos;s suitability
          before final confirmation of the tuition placement.
        </p>

        <SectionHeading n={8}>Refund and Cancellation Policy</SectionHeading>
        <p className="mt-3 font-semibold text-foreground">
          A. Teacher Due Diligence &amp; Non-Refundable Cancellations
        </p>
        <p className="mt-2">
          The Applicant is responsible for verifying all vacancy details, including location, distance,
          and travel logistics, before accepting a tuition offer.
        </p>
        <p className="mt-2">
          If the Applicant cancels an assigned tuition (before or after the demo class) due to personal
          reasons, distance/location issues, or scheduling conflicts attributable to the Applicant,{" "}
          <strong className="font-semibold text-foreground">no refund</strong> of the commission will be
          provided.
        </p>
        <p className="mt-3 font-semibold text-foreground">B. Rejection After Demo Class</p>
        <p className="mt-2">
          If the Applicant conducts a demo class but is rejected by the client (parent/student):
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>The Company reserves a seven (7) day period, starting from the date of rejection, to find an alternative tuition vacancy for the Applicant.</li>
          <li>If a suitable replacement is found within this period, the commission paid will be transferred to the new placement.</li>
          <li>If no suitable placement is available after seven (7) days, a refund of the paid commission will be provided, minus a service charge of <strong className="font-semibold text-foreground">NPR 500</strong>.</li>
        </ul>
        <p className="mt-3 font-semibold text-foreground">C. Cancellation Before Demo (Client Fault)</p>
        <p className="mt-2">
          If the tuition is cancelled by the Client or Company before a demo class has taken place
          (through no fault of the Applicant), a{" "}
          <strong className="font-semibold text-foreground">full refund</strong> of the paid commission
          will be provided.
        </p>

        <SectionHeading n={9}>Status as an Independent Service Provider</SectionHeading>
        <p className="mt-2">
          The Applicant acknowledges that the Company acts as a neutral facilitator and does not employ
          teachers or function as an educational institution.
        </p>
        <p className="mt-2">
          Teachers are independent service providers. As independent providers, Applicants are
          responsible for their own teaching methods, schedules (as agreed with parents), and overall
          service delivery.
        </p>
        <p className="mt-2">
          This independent relationship is intended to comply with applicable Nepalese law, including the
          Labour Act, 2074 (2017), where applicable.
        </p>
        <p className="mt-2">
          The Applicant understands that the Company does not provide tuition services itself and does
          not guarantee any specific academic outcomes for students.
        </p>

        <SectionHeading n={10}>Acceptance of Terms and Conditions</SectionHeading>
        <p className="mt-2">
          By submitting the teacher application or accepting a tuition opportunity facilitated by{" "}
          {SITE.fullName}, the Applicant confirms that they have read, understood, and agreed to these
          Terms and Conditions, subject to applicable requirements for forming a binding agreement under
          Nepalese law.
        </p>

        {/* Acceptance block */}
        <div className="mt-8 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Agreement Acceptance
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Teacher Name
              </dt>
              <dd className="font-medium text-foreground">{name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </dt>
              <dd className="font-medium text-foreground">{date}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Signature
              </dt>
              <dd className="font-[cursive] text-lg text-foreground">{name}</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}
