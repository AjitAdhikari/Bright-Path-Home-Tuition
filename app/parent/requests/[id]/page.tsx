import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Star } from "lucide-react";
import { PaymentPanel } from "@/components/payments/PaymentPanel";
import { createClient } from "@/lib/supabase/server";
import { SITE, type CaseStatus } from "@/lib/constants";
import type { MatchedTutor } from "@/app/(public)/find-tutor/actions";
import { cn, npr, prettyDate } from "@/lib/utils";
import { RequestSteps } from "../../RequestSteps";
import {
  loadParentWork,
  requestTitle,
  shortDate,
  waLink,
  NEXT_STEP,
  type SharedTutor,
} from "../../data";

// Statuses where paying the first month is the natural next step.
const PAY_STAGES: CaseStatus[] = ["tutors_shared", "demo_scheduled", "demo_done", "confirmed"];

export default async function ParentRequestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { requests, tutors, tuitions } = await loadParentWork(supabase, user?.id ?? "");
  const request = requests.find((r) => r.id === id);
  if (!request) notFound();

  const ref = id.slice(0, 8).toUpperCase();
  const shared = tutors.filter((t) => t.requestId === id && t.status !== "declined");
  const tuition = tuitions.find((t) => t.requestId === id && t.status === "active") ?? tuitions.find((t) => t.requestId === id);

  // Other approved tutors who fit, minus the ones already shared.
  const { data: matchData } = await supabase.rpc("match_tutors" as never, { p_request: id } as never);
  const sharedIds = new Set(shared.map((t) => t.tutorId));
  const suggestions = ((matchData ?? []) as MatchedTutor[]).filter((m) => !sharedIds.has(m.user_id));

  const showPayment = PAY_STAGES.includes(request.status);
  const needsYou = request.status === "tutors_shared" || request.status === "confirmed";

  return (
    <div className="space-y-10">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All requests
      </Link>

      {/* Where it stands */}
      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              Request <span className="font-mono">#{ref}</span> · sent {prettyDate(request.createdAt)}
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground">
              {requestTitle(request)}
            </h2>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <RequestSteps status={request.status} />
        </div>

        <p
          className={cn(
            "border-t border-border px-5 py-4 text-sm sm:px-6",
            needsYou ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {NEXT_STEP[request.status]}
        </p>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="min-w-0 space-y-10">
          {/* Shared tutors */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Tutors we&apos;ve shared with you</h3>
            {shared.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-5 py-8">
                <p className="text-sm font-medium text-foreground">We&apos;re still choosing.</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Our team hand-picks verified tutors for each request and calls you before
                  sharing them here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {shared.map((t) => (
                  <SharedRow key={t.matchId} tutor={t} ref_={ref} />
                ))}
              </ul>
            )}
          </section>

          {/* Suggestions */}
          {suggestions.length > 0 && request.status !== "active" && request.status !== "closed" && (
            <section>
              <h3 className="text-sm font-semibold text-foreground">Other tutors who fit</h3>
              <p className="mb-3 mt-1 text-sm text-muted-foreground">
                Verified tutors who teach these subjects in your area. Ask us if you&apos;d like to
                meet one of them.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {suggestions.slice(0, 6).map((m) => (
                  <li key={m.user_id} className="flex flex-col rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={m.full_name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{m.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[m.education, m.experience_years > 0 && `${m.experience_years} yrs`].filter(Boolean).join(" · ") ||
                            "Verified tutor"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{m.subjects.join(", ")}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-sm">
                      <span className="tabular-nums text-foreground">
                        from <span className="font-semibold">{npr(m.from_fee)}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {m.teaches_online && <span>Online</span>}
                        {m.rating_avg > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-foreground">
                            <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
                            {Number(m.rating_avg).toFixed(1)}
                          </span>
                        ) : (
                          <span>New</span>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Side column */}
        <aside className="space-y-10 text-sm">
          <section>
            <h3 className="mb-3 font-semibold text-foreground">What you asked for</h3>
            <dl className="divide-y divide-border rounded-lg border border-border bg-card">
              {[
                ["Class", request.grade],
                ["Board", request.board],
                ["Subjects", request.subjects.join(", ")],
                ["Where", request.mode === "online" ? "Online" : request.area ? `${request.area} (home)` : "At home"],
                ["Budget", request.budget ? `up to ${npr(request.budget)}/mo` : null],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 px-4 py-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className={v ? "text-foreground" : "text-muted-foreground/60"}>{v || "Not given"}</dd>
                </div>
              ))}
            </dl>
            <a
              href={waLink(SITE.whatsapp, `Hi ${SITE.name}, I'd like to change request #${ref}.`)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-secondary hover:underline"
            >
              Something changed? Tell us
            </a>
          </section>

          {tuition && (
            <section>
              <h3 className="mb-3 font-semibold text-foreground">Your tuition</h3>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="font-medium text-foreground">{tuition.tutorName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {npr(tuition.monthlyFee)} a month
                  {tuition.startDate && ` · since ${shortDate(tuition.startDate)}`}
                </p>
              </div>
            </section>
          )}

          {showPayment && (
            <section>
              <h3 className="mb-2 font-semibold text-foreground">Paying the first month</h3>
              <p className="mb-4 text-muted-foreground">
                Happy after the demo? Pay the first month to lock in your tutor: scan our QR and send
                us the receipt.
              </p>
              <PaymentPanel reference={id} amount={tuition?.monthlyFee} />
            </section>
          )}

          <section className="border-t border-border pt-6">
            <p className="font-medium text-foreground">Not the right fit?</p>
            <p className="mt-1 text-muted-foreground">We can share a different tutor.</p>
            <a
              href={waLink(SITE.whatsapp, `Hi ${SITE.name}, I'd like a different tutor for request #${ref}.`)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-secondary hover:underline"
            >
              Ask for another tutor <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const SHARED_STATUS: Record<SharedTutor["status"], string> = {
  shared: "Shared with you",
  accepted: "Ready for a demo",
  declined: "Not available",
  demo_scheduled: "Demo booked",
  demo_done: "Demo done",
  chosen: "Your tutor",
  not_chosen: "Not chosen",
};

function SharedRow({ tutor: t, ref_ }: { tutor: SharedTutor; ref_: string }) {
  const canBook = t.status === "shared" || t.status === "accepted";
  const faded = t.status === "not_chosen";
  return (
    <li className={cn("flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4", faded && "opacity-60")}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={t.name} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-foreground">{t.name}</p>
            {t.rating > 0 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
                {t.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {[t.education, t.experienceYears > 0 && `${t.experienceYears} yrs teaching`, t.proposedFee && `${npr(t.proposedFee)}/mo`]
              .filter(Boolean)
              .join(" · ") || "Verified tutor"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-12 sm:pl-0">
        <span
          className={cn(
            "text-xs font-medium",
            t.status === "chosen" ? "text-success" : t.status === "demo_scheduled" ? "text-warning" : "text-muted-foreground"
          )}
        >
          {t.status === "demo_scheduled" && t.demoDate ? `Demo ${shortDate(t.demoDate)}` : SHARED_STATUS[t.status]}
        </span>
        {canBook && (
          <a
            href={waLink(SITE.whatsapp, `Hi ${SITE.name}, I'd like a free demo class with ${t.name} (request #${ref_}).`)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Book free demo
          </a>
        )}
      </div>
    </li>
  );
}

function Avatar({ name }: { name: string }) {
  const p = name.trim().split(/\s+/);
  const ini = ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {ini || "?"}
    </span>
  );
}
