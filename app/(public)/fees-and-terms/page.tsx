import type { Metadata } from "next";
import { Card, Badge } from "@/components/ui/Card";
import { npr } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fees & terms",
  description:
    "How Bright Path's commission, cancellations and replacements work. Clear, written rules — no surprises.",
};

const terms = [
  ["First month in advance", "The first month's fee is paid to Bright Path before or on the first regular class. This keeps the match fair for both sides."],
  ["Cancellation in the first month", "If you cancel in the first month and it is not the tutor's fault, we split what was paid for the classes already taken."],
  ["Tutor leaves early", "If a tutor stops in the first month, we arrange a replacement at no extra matching fee."],
  ["Free replacement", "Not the right fit after the demo or early on? Ask for another tutor — back to shortlisting, no extra charge."],
  ["From month two", "You pay the tutor directly. Bright Path's fee is a one-time commission, not a monthly cut."],
];

export default function FeesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="text-center">
        <Badge tone="brand">Fees &amp; terms</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          One fee. No surprises.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-600">
          Bright Path charges a one-time commission of{" "}
          <strong className="text-ink-900">50% of the first month&apos;s fee</strong>,
          only when you confirm a tutor. Browsing and demos are free.
        </p>
      </div>

      <Card className="mt-10 bg-primary text-primary-foreground">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/80">
          A worked example
        </p>
        <div className="mt-4 space-y-2 text-sm">
          <Row k="Agreed monthly fee" v={npr(8000)} />
          <Row k="You pay Bright Path for month one" v={npr(8000)} />
          <Row k="Bright Path keeps (50%)" v={npr(4000)} />
          <Row k="Tutor receives (paid after teaching)" v={npr(4000)} />
          <div className="my-3 h-px bg-primary-foreground/20" />
          <Row k="From month two — you pay the tutor directly" v={npr(8000)} strong />
        </div>
      </Card>

      <section className="mt-10 space-y-3">
        {terms.map(([t, b]) => (
          <Card key={t}>
            <p className="font-semibold text-ink-900">{t}</p>
            <p className="mt-1 text-sm text-ink-600">{b}</p>
          </Card>
        ))}
      </section>

      <p className="mt-8 text-center text-xs text-ink-400">
        Payments accepted via eSewa, Khalti, Fonepay QR, bank transfer or cash
        to your Bright Path agent. A payment counts only once our server confirms it.
      </p>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-brand-100">{k}</span>
      <span className={strong ? "font-bold" : "font-semibold"}>{v}</span>
    </div>
  );
}
