import { Card, Badge } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { StatTile } from "@/components/dashboard/Shell";
import { npr } from "@/lib/utils";

/** Tutor home: verification banner + matching leads. */
const verification: "pending" | "needs_info" | "approved" = "approved";

const leads = [
  ["SEE · Maths, Science", "Baneshwor", 9000, "Evenings"],
  ["Class 6–8 · English", "Koteshwor", 7000, "Any time"],
];

export default function TutorHome() {
  return (
    <div className="space-y-8">
      <VerificationBanner status={verification} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Active tuitions" value={3} />
        <StatTile label="This month" value={npr(13500)} sub="expected earnings" tone="accent" />
        <StatTile label="Rating" value="4.9★" sub="32 reviews" tone="ink" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">
            New leads near you
          </h2>
          <Badge tone="accent">{leads.length} new</Badge>
        </div>
        <div className="space-y-3">
          {leads.map(([need, area, fee, when]) => (
            <Card key={need as string} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink-900">{need}</p>
                <p className="text-sm text-ink-500">
                  {area} · {npr(fee as number)} · {when}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Decline</Button>
                <Button size="sm">Accept lead</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function VerificationBanner({
  status,
}: {
  status: "pending" | "needs_info" | "approved";
}) {
  if (status === "approved") {
    return (
      <Card className="flex items-center gap-4 border-green-200 bg-green-50">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-green-900">You&apos;re verified and visible to parents</p>
          <p className="text-sm text-green-700">Keep your profile and availability up to date to get more leads.</p>
        </div>
      </Card>
    );
  }
  if (status === "needs_info") {
    return (
      <Card className="flex items-center justify-between gap-4 border-amber-200 bg-amber-50">
        <div className="flex items-center gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-900">We need a bit more</p>
            <p className="text-sm text-amber-700">Please upload your latest certificate to finish verification.</p>
          </div>
        </div>
        <ButtonLink href="/tutor/documents" size="sm">Upload</ButtonLink>
      </Card>
    );
  }
  return (
    <Card className="flex items-center gap-4 border-brand-200 bg-brand-50">
      <span className="text-2xl">⏳</span>
      <div>
        <p className="font-semibold text-brand-900">Verification in progress</p>
        <p className="text-sm text-brand-700">We&apos;re reviewing your documents and will call you for a short interview.</p>
      </div>
    </Card>
  );
}
