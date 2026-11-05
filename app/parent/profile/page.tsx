import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";
import { prettyDate } from "@/lib/utils";
import { waLink } from "../data";

/** The parent's account details, read-only. Changes go through our team. */
export default async function ParentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user?.id ?? "";

  const [{ data: me }, { count: requestCount }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, phone, created_at").eq("id", uid).maybeSingle(),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("parent_id", uid),
  ]);
  const p = (me ?? {}) as { full_name?: string; email?: string | null; phone?: string | null; created_at?: string };

  const name = p.full_name || "Parent";
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();

  const rows: [string, string | null | undefined][] = [
    ["Full name", name],
    ["Email", p.email ?? user?.email],
    ["Phone", p.phone],
    ["Member since", p.created_at ? prettyDate(p.created_at) : null],
    ["Requests sent", String(requestCount ?? 0)],
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <section className="flex items-center gap-5 rounded-lg border border-border bg-card p-6">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {initials || "?"}
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground">{name}</h2>
          <p className="truncate text-sm text-muted-foreground">Parent account</p>
        </div>
      </section>

      <dl className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-4 px-5 py-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={value ? "break-words text-foreground" : "text-muted-foreground/60"}>
              {value || "Not given"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-muted-foreground">
          To change your name or phone number,{" "}
          <a
            href={waLink(SITE.whatsapp, `Hi ${SITE.name}, I'd like to update my account details (${name}).`)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-secondary hover:underline"
          >
            message us on WhatsApp
          </a>
          .
        </p>
      </div>
    </div>
  );
}
