import Link from "next/link";
import { Check, Star, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Figures } from "@/components/dashboard/Figures";
import { SITE } from "@/lib/constants";
import { cn, npr } from "@/lib/utils";
import { loadTutorWork, describeRequest, ktmDay, TZ, type Lead } from "./data";

// Matches still in play. declined / chosen / not_chosen are finished.
const OPEN: Lead["status"][] = ["shared", "accepted", "demo_scheduled", "demo_done"];

export default async function TutorHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user?.id ?? "";

  const [
    work,
    { data: me },
    { data: tp },
    { count: subjectCount },
    { count: areaCount },
    { count: slotCount },
    { data: reviewRows },
    { data: payoutRows },
  ] = await Promise.all([
    loadTutorWork(supabase, uid),
    supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
    supabase
      .from("tutor_profiles")
      .select("rating_avg, bio, education, photo_path, teaches_online, available_days")
      .eq("user_id", uid)
      .maybeSingle(),
    supabase.from("tutor_subjects").select("id", { count: "exact", head: true }).eq("tutor_id", uid),
    supabase.from("tutor_areas").select("area_id", { count: "exact", head: true }).eq("tutor_id", uid),
    supabase.from("tutor_availability").select("id", { count: "exact", head: true }).eq("tutor_id", uid),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at")
      .eq("tutor_id", uid)
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("amount, status").eq("direction", "payout"),
  ]);

  const { leads, tuitions } = work;
  const active = tuitions.filter((t) => t.status === "active");
  const openLeads = leads.filter((l) => OPEN.includes(l.status));
  const newLeads = openLeads.filter((l) => l.status === "shared");

  const today = ktmDay();
  const demos = leads
    .filter((l) => l.status === "demo_scheduled" && l.demoDate && l.demoDate >= today)
    .sort((a, b) => a.demoDate!.localeCompare(b.demoDate!));

  // Classes held this month, per tuition (attendance is readable by both parties).
  const monthStart = today.slice(0, 8) + "01";
  const { data: attendanceRows } = active.length
    ? await supabase
        .from("attendance")
        .select("tuition_id, class_date, status")
        .in("tuition_id", active.map((t) => t.id))
        .gte("class_date", monthStart)
    : { data: [] };
  const held = ((attendanceRows ?? []) as { tuition_id: string; status: string }[]).filter(
    (a) => a.status === "held"
  );
  const heldBy = new Map<string, number>();
  for (const a of held) heldBy.set(a.tuition_id, (heldBy.get(a.tuition_id) ?? 0) + 1);

  const reviews = (reviewRows ?? []) as {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }[];
  const profile = (tp ?? {}) as {
    rating_avg?: number | null;
    bio?: string | null;
    education?: string | null;
    photo_path?: string | null;
    teaches_online?: boolean | null;
    available_days?: string | null;
  };
  const rating = Number(profile.rating_avg ?? 0);

  const payouts = (payoutRows ?? []) as { amount: number; status: string }[];
  const pendingOut = payouts
    .filter((p) => p.status === "pending")
    .reduce((t, p) => t + Number(p.amount), 0);

  const monthlyIncome = active.reduce((t, x) => t + x.monthlyFee, 0);

  const firstName =
    ((me as { full_name?: string | null } | null)?.full_name ?? "").trim().split(/\s+/)[0] || "there";
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TZ }).format(now)
  );
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLine = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(now);

  const summary = [
    newLeads.length === 1
      ? "1 new lead is waiting for you"
      : newLeads.length > 1
        ? `${newLeads.length} new leads are waiting for you`
        : null,
    demos[0]?.demoDate === today ? "you have a demo class today" : null,
  ]
    .filter(Boolean)
    .join(", and ");

  const checklist = [
    { label: "Profile photo", done: !!profile.photo_path },
    { label: "Short bio", done: (profile.bio ?? "").trim().length >= 20 },
    { label: "Education", done: !!profile.education?.trim() },
    { label: "Subjects and fees", done: (subjectCount ?? 0) > 0 },
    { label: "Areas you cover", done: (areaCount ?? 0) > 0 || !!profile.teaches_online },
    { label: "When you're free", done: (slotCount ?? 0) > 0 || !!profile.available_days?.trim() },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{dateLine}</p>
          <h2 className="mt-1 font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground">
            {greeting}, {firstName}.
          </h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {summary ? capitalise(summary) + "." : "Nothing needs you right now."}
          </p>
        </div>
        <Link
          href="/tutor/tuitions"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          My students
        </Link>
      </div>

      <Figures
        items={[
          {
            label: "Active students",
            value: active.length,
            note: active.length ? `${npr(monthlyIncome)} a month in fees` : "None yet",
            href: "/tutor/tuitions",
          },
          {
            label: "Open leads",
            value: openLeads.length,
            note: newLeads.length ? `${newLeads.length} not answered yet` : "All answered",
          },
          {
            label: "Classes this month",
            value: held.length,
            note: "Marked as held",
          },
          {
            label: "Parent rating",
            value: rating > 0 ? rating.toFixed(1) : "—",
            note: reviews.length
              ? `From ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
              : "No reviews yet",
          },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        {/* Main column */}
        <div className="min-w-0 space-y-10">
          <section>
            <Heading title="Leads shared with you" />
            <div className="rounded-lg border border-border bg-card">
              {openLeads.length === 0 ? (
                <Empty
                  title="No open leads right now."
                  body="When a family near you needs a tutor with your subjects, we call you first and then share it here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {openLeads.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} />
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <Heading title="Your students" link={{ href: "/tutor/tuitions", label: "See all" }} />
            <div className="rounded-lg border border-border bg-card">
              {active.length === 0 ? (
                <Empty
                  title="No regular classes yet."
                  body="Once a parent chooses you after a demo class, the tuition shows up here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {active.slice(0, 5).map((t) => {
                    const d = describeRequest(t.request);
                    const n = heldBy.get(t.id) ?? 0;
                    return (
                      <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{d.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {d.detail}
                            {t.startDate && ` · since ${shortDate(t.startDate)}`}
                          </p>
                        </div>
                        <p className="hidden text-right text-xs text-muted-foreground sm:block">
                          <span className="block text-sm font-medium tabular-nums text-foreground">{n}</span>
                          {n === 1 ? "class" : "classes"} this month
                        </p>
                        <p className="w-24 text-right text-sm font-semibold tabular-nums text-foreground">
                          {npr(t.monthlyFee)}
                          <span className="block text-xs font-normal text-muted-foreground">a month</span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section>
            <Heading title="What parents say" />
            {reviews.length === 0 ? (
              <div className="rounded-lg border border-border bg-card">
                <Empty
                  title="No reviews yet."
                  body="Parents can leave a review after a month of classes. Good reviews put you higher in their search."
                />
              </div>
            ) : (
              <ul className="space-y-3">
                {reviews.slice(0, 3).map((r) => (
                  <li key={r.id} className="rounded-lg border border-border bg-card px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <Stars value={r.rating} />
                      <span className="text-xs text-muted-foreground">{shortDate(r.created_at)}</span>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm leading-relaxed text-foreground">&ldquo;{r.comment}&rdquo;</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-10 text-sm">
          <section>
            <h3 className="mb-3 font-semibold text-foreground">Coming up</h3>
            {demos.length === 0 ? (
              <p className="text-muted-foreground">No demo classes booked.</p>
            ) : (
              <ul className="space-y-3">
                {demos.slice(0, 4).map((l) => {
                  const d = describeRequest(l.request);
                  const date = new Date(l.demoDate! + "T00:00:00");
                  return (
                    <li key={l.id} className="flex gap-3">
                      <span className="grid w-11 shrink-0 place-items-center rounded-md border border-border bg-card py-1 text-center leading-none">
                        <span className="text-[10px] font-semibold uppercase text-warning">
                          {date.toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                        <span className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                          {date.getDate()}
                        </span>
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="block truncate font-medium text-foreground">Demo · {d.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {l.demoDate === today ? "Today" : d.detail}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-semibold text-foreground">Your profile</h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {doneCount} of {checklist.length}
              </span>
            </div>
            <div className="mb-4 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(doneCount / checklist.length) * 100}%` }}
              />
            </div>
            <ul className="space-y-2">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded-full",
                      c.done ? "bg-primary text-primary-foreground" : "border border-input"
                    )}
                  >
                    {c.done && <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />}
                  </span>
                  <span className={c.done ? "text-muted-foreground" : "text-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              A full profile gets shared with more families.{" "}
              <Link href="/tutor/profile" className="text-secondary hover:underline">
                See your profile
              </Link>
              , and{" "}
              <a href={waLink("Hi Bright Path, I'd like to update my tutor profile.")} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
                message us
              </a>{" "}
              to fill in anything missing.
            </p>
          </section>

          <section>
            <h3 className="mb-3 font-semibold text-foreground">Payouts</h3>
            <dl className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <dt className="text-muted-foreground">Waiting to be paid</dt>
              <dd className="font-semibold tabular-nums text-foreground">{npr(pendingOut)}</dd>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              We collect the first month from the parent and release your 50% once those
              classes are taught. After that, parents pay you directly.
            </p>
            <Link href="/tutor/earnings" className="mt-2 inline-block text-secondary hover:underline">
              Earnings history
            </Link>
          </section>

          <section className="border-t border-border pt-6">
            <p className="font-medium text-foreground">Something not right?</p>
            <p className="mt-1 text-muted-foreground">
              A lead, a payment, a parent — we&apos;re a message away.
            </p>
            <a
              href={waLink("Hi Bright Path, I need some help with my tutor account.")}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-secondary hover:underline"
            >
              WhatsApp the team <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const STATUS_TEXT: Partial<Record<Lead["status"], string>> = {
  shared: "New",
  accepted: "You said yes",
  demo_scheduled: "Demo booked",
  demo_done: "Parent deciding",
};

function LeadRow({ lead }: { lead: Lead }) {
  const d = describeRequest(lead.request);
  const isNew = lead.status === "shared";
  const budget = lead.proposedFee ?? lead.request?.budget ?? null;
  const ref = lead.id.slice(0, 8).toUpperCase();

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-foreground">{d.title}</p>
          <span
            className={cn(
              "shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold",
              isNew ? "bg-accent/25 text-warning" : "bg-muted text-muted-foreground"
            )}
          >
            {lead.status === "demo_scheduled" && lead.demoDate
              ? `Demo ${shortDate(lead.demoDate)}`
              : STATUS_TEXT[lead.status]}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[d.detail, budget ? `up to ${npr(budget)}/mo` : null, `shared ${shortDate(lead.sharedAt)}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {isNew && (
        <a
          href={waLink(
            `Hi Bright Path, I'm interested in the ${d.title} lead${d.detail ? ` (${d.detail})` : ""}. Ref ${ref}.`
          )}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 self-start rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted sm:self-auto"
        >
          I&apos;m interested
        </a>
      )}
    </li>
  );
}

function Heading({ title, link }: { title: string; link?: { href: string; label: string } }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {link && (
        <Link href={link.href} className="text-sm text-secondary hover:underline">
          {link.label}
        </Link>
      )}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-5 py-8">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn("h-3.5 w-3.5", i <= value ? "fill-accent text-accent" : "text-border")}
        />
      ))}
    </span>
  );
}

function waLink(text: string) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

function shortDate(d: string) {
  return new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: d.length === 10 ? undefined : TZ,
  });
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
