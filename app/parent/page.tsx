import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Figures } from "@/components/dashboard/Figures";
import { SITE } from "@/lib/constants";
import { cn, npr } from "@/lib/utils";
import { RequestSteps } from "./RequestSteps";
import {
  loadParentWork,
  ktmDay,
  shortDate,
  requestTitle,
  requestDetail,
  waLink,
  NEXT_STEP,
  TZ,
} from "./data";

export default async function ParentHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user?.id ?? "";

  const [{ requests, tutors, tuitions, payments }, { data: me }] = await Promise.all([
    loadParentWork(supabase, uid),
    supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
  ]);

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

  // Nothing yet: one clear way forward.
  if (requests.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-6">
        <p className="text-sm text-muted-foreground">{dateLine}</p>
        <h2 className="mt-1 font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground">
          {greeting}, {firstName}.
        </h2>
        <div className="mt-8 rounded-lg border border-border bg-card p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-foreground">Let&apos;s find your child a tutor.</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tell us the class, subjects and where you live. We&apos;ll call you with 2–3 verified
            tutors — usually the same day. The first demo class is free.
          </p>
          <ol className="mt-6 space-y-3 border-l border-border pl-4 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">You tell us what you need.</span> Class,
              subjects and area.
            </li>
            <li>
              <span className="font-medium text-foreground">We call and share tutors.</span> All of
              them are checked by our team.
            </li>
            <li>
              <span className="font-medium text-foreground">Try a free demo class.</span> You only pay
              once you&apos;re happy.
            </li>
          </ol>
          <Link
            href="/find-tutor"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Start a request <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const today = ktmDay();
  const open = requests.filter((r) => r.status !== "closed" && r.status !== "active");
  const active = tuitions.filter((t) => t.status === "active");
  const demos = tutors
    .filter((t) => t.status === "demo_scheduled" && t.demoDate && t.demoDate >= today)
    .sort((a, b) => a.demoDate!.localeCompare(b.demoDate!));
  const toChoose = requests.filter((r) => r.status === "tutors_shared");
  const toPay = requests.filter((r) => r.status === "confirmed");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const paidTotal = payments.filter((p) => p.status === "paid").reduce((t, p) => t + p.amount, 0);

  // Classes held this month across active tuitions.
  const monthStart = today.slice(0, 8) + "01";
  const { data: attRows } = active.length
    ? await supabase
        .from("attendance")
        .select("tuition_id, status, class_date")
        .in("tuition_id", active.map((t) => t.id))
        .gte("class_date", monthStart)
    : { data: [] };
  const att = (attRows ?? []) as { tuition_id: string; status: string; class_date: string }[];
  const heldBy = new Map<string, number>();
  for (const a of att) if (a.status === "held") heldBy.set(a.tuition_id, (heldBy.get(a.tuition_id) ?? 0) + 1);
  const heldTotal = [...heldBy.values()].reduce((t, n) => t + n, 0);

  // The single most useful sentence for today.
  const summary =
    demos[0]?.demoDate === today
      ? `${demos[0].name.split(" ")[0]}'s demo class is today.`
      : toPay.length
        ? "One step left: pay the first month to start classes."
        : toChoose.length
          ? "Tutors are waiting for you to choose one for a demo."
          : open.length
            ? "We're working on your request."
            : active.length
              ? "Classes are running. Nothing needs you right now."
              : "Nothing needs you right now.";

  const tutorsByRequest = new Map<string, typeof tutors>();
  for (const t of tutors) {
    if (t.status === "declined" || t.status === "not_chosen") continue;
    tutorsByRequest.set(t.requestId, [...(tutorsByRequest.get(t.requestId) ?? []), t]);
  }

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{dateLine}</p>
          <h2 className="mt-1 font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground">
            {greeting}, {firstName}.
          </h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">{summary}</p>
        </div>
        <Link
          href="/find-tutor"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New request
        </Link>
      </div>

      <Figures
        items={[
          {
            label: "Open requests",
            value: open.length,
            note: toChoose.length ? `${toChoose.length} waiting for your choice` : "We'll keep you posted",
          },
          {
            label: "Active tutors",
            value: active.length,
            note: active.length ? `${npr(active.reduce((t, x) => t + x.monthlyFee, 0))} a month` : "None yet",
          },
          { label: "Classes this month", value: heldTotal, note: "Marked as held" },
          {
            label: "Paid to Bright Path",
            value: npr(paidTotal),
            note: pendingPayments.length ? `${pendingPayments.length} payment being checked` : "First-month fees",
          },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="min-w-0 space-y-10">
          {/* Requests */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Your requests</h3>
            <ul className="space-y-3">
              {requests.map((r) => {
                const shared = tutorsByRequest.get(r.id) ?? [];
                const needsYou = r.status === "tutors_shared" || r.status === "confirmed";
                return (
                  <li key={r.id}>
                    <Link
                      href={`/parent/requests/${r.id}`}
                      className={cn(
                        "group block rounded-lg border bg-card px-5 py-4 transition-colors hover:bg-muted/40",
                        needsYou ? "border-accent/70" : "border-border",
                        r.status === "closed" && "opacity-70"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{requestTitle(r)}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {requestDetail(r)} · sent {shortDate(r.createdAt)}
                          </p>
                        </div>
                        <ArrowRight
                          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </div>
                      <div className="mt-4">
                        <RequestSteps status={r.status} compact />
                      </div>
                      <p className={cn("mt-2.5 text-sm", needsYou ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {NEXT_STEP[r.status]}
                        {shared.length > 0 && r.status === "tutors_shared" && (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            {shared.length} tutor{shared.length === 1 ? "" : "s"} shared.
                          </span>
                        )}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Tutors */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Your tutors</h3>
            <div className="rounded-lg border border-border bg-card">
              {active.length === 0 ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-medium text-foreground">No regular classes yet.</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    After the demo, once you confirm a tutor and pay the first month, they&apos;ll
                    show up here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {active.map((t) => {
                    const req = requests.find((r) => r.id === t.requestId);
                    const n = heldBy.get(t.id) ?? 0;
                    return (
                      <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {initials(t.tutorName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{t.tutorName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {req ? requestTitle(req) : "Tuition"}
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
        </div>

        {/* Side column */}
        <aside className="space-y-10 text-sm">
          <section>
            <h3 className="mb-3 font-semibold text-foreground">Demo classes</h3>
            {demos.length === 0 ? (
              <p className="text-muted-foreground">No demo classes booked.</p>
            ) : (
              <ul className="space-y-3">
                {demos.slice(0, 4).map((d) => {
                  const date = new Date(d.demoDate! + "T00:00:00");
                  const req = requests.find((r) => r.id === d.requestId);
                  return (
                    <li key={d.matchId} className="flex gap-3">
                      <span className="grid w-11 shrink-0 place-items-center rounded-md border border-border bg-card py-1 text-center leading-none">
                        <span className="text-[10px] font-semibold uppercase text-warning">
                          {date.toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                        <span className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                          {date.getDate()}
                        </span>
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="block truncate font-medium text-foreground">{d.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {d.demoDate === today ? "Today" : "Free demo"}
                          {req && ` · ${requestTitle(req)}`}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-3 font-semibold text-foreground">Payments</h3>
            {payments.length === 0 ? (
              <p className="text-muted-foreground">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {payments.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block font-medium tabular-nums text-foreground">{npr(p.amount)}</span>
                      <span className="block text-xs capitalize text-muted-foreground">
                        {p.method} · {shortDate(p.date)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium",
                        p.status === "paid" && "text-success",
                        p.status === "pending" && "text-warning",
                        (p.status === "failed" || p.status === "refunded") && "text-muted-foreground"
                      )}
                    >
                      {p.status === "pending" ? "Being checked" : p.status === "paid" ? "Received" : cap(p.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              You pay Bright Path for the first month only. From month two you pay your tutor
              directly.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <p className="font-medium text-foreground">Questions about a tutor or a payment?</p>
            <p className="mt-1 text-muted-foreground">Message our team and we&apos;ll sort it out.</p>
            <a
              href={waLink(SITE.whatsapp, `Hi ${SITE.name}, I have a question about my tuition.`)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-secondary hover:underline"
            >
              WhatsApp us <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
