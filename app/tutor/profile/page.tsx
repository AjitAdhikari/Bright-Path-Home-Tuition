import Link from "next/link";
import { BadgeCheck, ArrowUpRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";
import { cn, npr, prettyDate } from "@/lib/utils";

/*
 * The tutor's profile, read-only. Everything here was collected in the
 * application and checked by our team, so changes go through us.
 */

type TP = {
  bio: string | null;
  education: string | null;
  experience_years: number | null;
  gender: string | null;
  photo_path: string | null;
  teaches_online: boolean | null;
  verification_status: string;
  verified_at: string | null;
  date_of_birth: string | null;
  whatsapp: string | null;
  permanent_address: string | null;
  current_address: string | null;
  city: string | null;
  district: string | null;
  preferred_location: string | null;
  max_travel_km: number | null;
  available_days: string | null;
  available_slots: string | null;
  preferred_student_level: string | null;
  expected_fee: number | null;
  languages: string | null;
  why_join: string | null;
  strengths: string | null;
  teaching_approach: string | null;
  additional_info: string | null;
  intro_video_url: string | null;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS = [
  { key: "morning", label: "Morning" },
  { key: "day", label: "Day" },
  { key: "evening", label: "Evening" },
] as const;

export default async function TutorProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user?.id ?? "";

  const [
    { data: me },
    { data: tpRow },
    { data: subjectRows },
    { data: areaRows },
    { data: slotRows },
    { data: qualRows },
    { data: expRows },
    { data: appRow },
    { count: docCount },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, email, phone, created_at").eq("id", uid).maybeSingle(),
    supabase.from("tutor_profiles").select("*").eq("user_id", uid).maybeSingle(),
    supabase
      .from("tutor_subjects")
      .select("id, monthly_fee, subject:subjects(name, sort_order), level:levels(name, sort_order)")
      .eq("tutor_id", uid),
    supabase.from("tutor_areas").select("area:areas(name, municipality)").eq("tutor_id", uid),
    supabase.from("tutor_availability").select("day_of_week, slot").eq("tutor_id", uid),
    supabase
      .from("tutor_qualifications")
      .select("id, level, faculty, major, institution, graduation_year, gpa, additional")
      .eq("tutor_id", uid)
      .order("sort_order"),
    supabase
      .from("tutor_experiences")
      .select("id, institution, role, classes, subjects, description, achievements, methodology")
      .eq("tutor_id", uid)
      .order("sort_order"),
    supabase
      .from("tutor_applications")
      .select("application_number, submitted_at")
      .eq("tutor_id", uid)
      .maybeSingle(),
    supabase.from("tutor_documents").select("id", { count: "exact", head: true }).eq("tutor_id", uid),
  ]);

  const person = (me ?? {}) as { full_name?: string; email?: string | null; phone?: string | null };
  const tp = (tpRow ?? {}) as Partial<TP>;
  const app = appRow as { application_number: string; submitted_at: string | null } | null;

  const subjects = ((subjectRows ?? []) as unknown as {
    id: string;
    monthly_fee: number;
    subject: { name: string; sort_order: number } | null;
    level: { name: string; sort_order: number } | null;
  }[]).sort(
    (a, b) =>
      (a.subject?.sort_order ?? 0) - (b.subject?.sort_order ?? 0) ||
      (a.level?.sort_order ?? 0) - (b.level?.sort_order ?? 0)
  );
  const areas = ((areaRows ?? []) as unknown as { area: { name: string; municipality: string | null } | null }[])
    .map((a) => a.area)
    .filter((a): a is { name: string; municipality: string | null } => !!a);
  const slots = new Set(
    ((slotRows ?? []) as { day_of_week: number; slot: string }[]).map((s) => `${s.day_of_week}:${s.slot}`)
  );
  const quals = (qualRows ?? []) as {
    id: string;
    level: string | null;
    faculty: string | null;
    major: string | null;
    institution: string | null;
    graduation_year: number | null;
    gpa: string | null;
    additional: string | null;
  }[];
  const exps = (expRows ?? []) as {
    id: string;
    institution: string | null;
    role: string | null;
    classes: string | null;
    subjects: string | null;
    description: string | null;
    achievements: string | null;
    methodology: string | null;
  }[];

  const name = person.full_name || "Tutor";
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  const photoUrl = tp.photo_path
    ? supabase.storage.from("avatars").getPublicUrl(tp.photo_path).data.publicUrl
    : null;
  const verified = tp.verification_status === "approved";
  const changeLink = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
    `Hi Bright Path, I'd like to update my tutor profile (${name}).`
  )}`;

  return (
    <div className="space-y-10">
      {/* Who */}
      <section className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- public bucket URL, no loader configured
          <img src={photoUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
            {initials || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">{name}</h2>
            {verified && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                Verified{tp.verified_at ? ` ${prettyDate(tp.verified_at)}` : ""}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[
              tp.education,
              tp.experience_years ? `${tp.experience_years} yr${tp.experience_years === 1 ? "" : "s"} teaching` : null,
              tp.city,
            ]
              .filter(Boolean)
              .join(" · ") || "Tutor"}
          </p>
          {app && (
            <p className="mt-1 text-xs text-muted-foreground">
              Application <span className="font-mono">{app.application_number}</span>
              {app.submitted_at && ` · submitted ${prettyDate(app.submitted_at)}`}
            </p>
          )}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-muted-foreground">
          Your profile was checked by our team, so it can&apos;t be edited here. If something is
          wrong or out of date,{" "}
          <a href={changeLink} target="_blank" rel="noreferrer" className="font-medium text-secondary hover:underline">
            message us on WhatsApp
          </a>{" "}
          and we&apos;ll update it.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Block title="Personal details">
          <Fields
            rows={[
              ["Full name", name],
              ["Email", person.email],
              ["Phone", person.phone],
              ["WhatsApp", tp.whatsapp],
              ["Date of birth", tp.date_of_birth ? prettyDate(tp.date_of_birth) : null],
              ["Gender", cap(tp.gender)],
              ["Current address", tp.current_address],
              ["Permanent address", tp.permanent_address],
              ["City", tp.city],
              ["District", tp.district],
            ]}
          />
        </Block>

        <Block title="Teaching preferences">
          <Fields
            rows={[
              ["Experience", tp.experience_years != null ? `${tp.experience_years} years` : null],
              ["Preferred students", tp.preferred_student_level],
              ["Teaches online", tp.teaches_online == null ? null : tp.teaches_online ? "Yes" : "No"],
              ["Preferred location", tp.preferred_location],
              ["Will travel up to", tp.max_travel_km ? `${tp.max_travel_km} km` : null],
              ["Expected fee", tp.expected_fee ? `${npr(Number(tp.expected_fee))} a month` : null],
              ["Languages", tp.languages],
            ]}
          />
        </Block>
      </div>

      <Block title="Subjects and fees">
        {subjects.length === 0 ? (
          <Missing />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="py-2.5 pl-5 pr-3 font-medium">Subject</th>
                  <th className="py-2.5 pr-3 font-medium">Level</th>
                  <th className="py-2.5 pr-5 text-right font-medium">Monthly fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjects.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pl-5 pr-3 font-medium text-foreground">{s.subject?.name ?? "—"}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{s.level?.name ?? "—"}</td>
                    <td className="py-3 pr-5 text-right tabular-nums text-foreground">{npr(Number(s.monthly_fee))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Block>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Block title="Areas you teach in">
          {areas.length === 0 ? (
            <Missing text={tp.teaches_online ? "Online only." : undefined} />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <li key={a.name} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                  {a.name}
                  {a.municipality && <span className="text-muted-foreground"> · {a.municipality}</span>}
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="When you're free">
          {slots.size > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr>
                    <th className="w-16" />
                    {DAYS.map((d) => (
                      <th key={d} className="pb-2 font-medium text-muted-foreground">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map((s) => (
                    <tr key={s.key}>
                      <th className="py-1 pr-2 text-left font-medium text-muted-foreground">{s.label}</th>
                      {DAYS.map((d, i) => {
                        const on = slots.has(`${i}:${s.key}`);
                        return (
                          <td key={d} className="p-1">
                            <span
                              aria-label={on ? `${d} ${s.label}: free` : `${d} ${s.label}: busy`}
                              className={cn(
                                "mx-auto block h-6 rounded-sm",
                                on ? "bg-primary" : "bg-muted"
                              )}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tp.available_days || tp.available_slots ? (
            <Fields
              rows={[
                ["Days", tp.available_days?.split(",").map((s) => s.trim()).join(", ")],
                ["Times", tp.available_slots?.split(",").map((s) => s.trim()).join(", ")],
              ]}
            />
          ) : (
            <Missing />
          )}
        </Block>
      </div>

      <Block title="About you">
        <div className="space-y-6 rounded-lg border border-border bg-card p-5 sm:p-6">
          <Prose label="Bio (parents read this first)" text={tp.bio} />
          <Prose label="How you teach" text={tp.teaching_approach} />
          <Prose label="Your strengths" text={tp.strengths} />
          <Prose label="Why you joined Bright Path" text={tp.why_join} />
          <Prose label="Anything else" text={tp.additional_info} />
          {tp.intro_video_url && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Intro video</p>
              <a
                href={tp.intro_video_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-secondary hover:underline"
              >
                Watch <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          )}
        </div>
      </Block>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Block title="Education">
          {quals.length === 0 ? (
            <Missing text={tp.education ?? undefined} />
          ) : (
            <ol className="space-y-3">
              {quals.map((q) => (
                <li key={q.id} className="rounded-lg border border-border bg-card px-5 py-4">
                  <p className="font-medium text-foreground">
                    {[q.level, q.major || q.faculty].filter(Boolean).join(", ") || "Qualification"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[q.institution, q.graduation_year, q.gpa && `GPA/score ${q.gpa}`].filter(Boolean).join(" · ")}
                  </p>
                  {q.additional && <p className="mt-2 text-sm text-foreground">{q.additional}</p>}
                </li>
              ))}
            </ol>
          )}
        </Block>

        <Block title="Teaching experience">
          {exps.length === 0 ? (
            <Missing />
          ) : (
            <ol className="space-y-3">
              {exps.map((e) => (
                <li key={e.id} className="rounded-lg border border-border bg-card px-5 py-4">
                  <p className="font-medium text-foreground">
                    {[e.role, e.institution].filter(Boolean).join(" at ") || "Experience"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[e.classes, e.subjects].filter(Boolean).join(" · ")}
                  </p>
                  {e.description && <p className="mt-2 text-sm text-foreground">{e.description}</p>}
                  {e.achievements && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Achievements: </span>
                      {e.achievements}
                    </p>
                  )}
                  {e.methodology && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Method: </span>
                      {e.methodology}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Block>
      </div>

      <Block title="Documents">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm">
          <p className="text-muted-foreground">
            {docCount
              ? `${docCount} document${docCount === 1 ? "" : "s"} on file. Only our team can see them.`
              : "No documents on file yet."}
          </p>
          <Link href="/tutor/documents" className="font-medium text-secondary hover:underline">
            View documents
          </Link>
        </div>
      </Block>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Fields({ rows }: { rows: [label: string, value: string | number | null | undefined][] }) {
  return (
    <dl className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-4 px-5 py-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={value ? "break-words text-foreground" : "text-muted-foreground/60"}>
            {value || "Not given"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Prose({ label, text }: { label: string; text: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 whitespace-pre-line text-sm leading-relaxed",
          text?.trim() ? "text-foreground" : "text-muted-foreground/60"
        )}
      >
        {text?.trim() || "Not given"}
      </p>
    </div>
  );
}

function Missing({ text }: { text?: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
      {text ?? "Nothing on file yet."}
    </p>
  );
}

function cap(s: string | null | undefined) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : null;
}
