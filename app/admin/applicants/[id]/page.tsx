import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  GraduationCap,
} from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import {
  DOC_TYPES,
  LEGACY_DOC_LABELS,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  type ApplicationStatus,
} from "@/lib/constants";
import { approveApplicant, rejectApplicant, requestChanges } from "../actions";

type Applicant = {
  id: string;
  application_number: string;
  status: ApplicationStatus;
  full_name: string;
  email: string;
  phone: string | null;
  education: string | null;
  experience_years: number | null;
  gender: string | null;
  bio: string | null;
  areas: string | null;
  levels: string | null;
  rejection_reason: string | null;
  admin_feedback: string | null;
  submitted_at: string | null;
};

type DocRow = {
  id: string;
  doc_type: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  created_at: string;
};

function formatOf(row: DocRow) {
  const ext = row.file_name?.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 4) return ext;
  if (row.mime_type?.includes("pdf")) return "PDF";
  if (row.mime_type?.includes("word")) return "DOC";
  if (row.mime_type?.includes("image")) return "Image";
  return "File";
}
function prettyDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ApplicantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: aData }, { data: dData }] = await Promise.all([
    supabase.from("tutor_applicants").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("applicant_documents")
      .select("id, doc_type, storage_path, file_name, mime_type, created_at")
      .eq("applicant_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const a = aData as Applicant | null;
  if (!a) notFound();
  const docs = (dData ?? []) as DocRow[];

  const preview = new Map<string, string>();
  const download = new Map<string, string>();
  await Promise.all(
    docs.map(async (d) => {
      const [{ data: p }, { data: dl }] = await Promise.all([
        supabase.storage.from("tutor-documents").createSignedUrl(d.storage_path, 3600),
        supabase.storage
          .from("tutor-documents")
          .createSignedUrl(d.storage_path, 3600, { download: d.file_name ?? true }),
      ]);
      if (p?.signedUrl) preview.set(d.id, p.signedUrl);
      if (dl?.signedUrl) download.set(d.id, dl.signedUrl);
    })
  );

  const byType = (t: string) => docs.filter((d) => d.doc_type === t);
  const known = new Set(DOC_TYPES.map((d) => d.type));
  const legacy = docs.filter((d) => !known.has(d.doc_type));
  const previewable = (r: DocRow) =>
    r.mime_type?.includes("pdf") || r.mime_type?.includes("image");
  const decided = a.status === "approved" || a.status === "rejected";

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/applicants"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to applications
      </Link>

      {/* Header */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{a.full_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {a.education ?? "No education on file"}
              {a.experience_years ? ` · ${a.experience_years} yrs experience` : ""}
            </p>
          </div>
          <div className="text-right">
            <Badge tone={APPLICATION_STATUS_TONE[a.status]}>
              {APPLICATION_STATUS_LABEL[a.status]}
            </Badge>
            <p className="mt-1.5 font-mono text-xs text-muted-foreground">
              {a.application_number}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-4 w-4" aria-hidden /> {a.email}
          </span>
          {a.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-4 w-4" aria-hidden /> {a.phone}
            </span>
          )}
          <span>Submitted {prettyDate(a.submitted_at)}</span>
        </div>
      </Card>

      {/* Profile details */}
      <Card className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <GraduationCap className="h-4 w-4" aria-hidden /> Teaching profile
        </h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Detail label="Gender" value={a.gender} />
          <Detail label="Levels" value={a.levels} />
          <Detail label="Areas" value={a.areas} />
        </dl>
        {a.bio && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Bio</p>
            <p className="mt-1 whitespace-pre-line text-sm text-foreground">{a.bio}</p>
          </div>
        )}
      </Card>

      {/* Documents */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">Documents</h2>
        <div className="space-y-3">
          {DOC_TYPES.map((spec) => {
            const rows = byType(spec.type);
            const required = spec.requirement === "required";
            return (
              <Card key={spec.type} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{spec.label}</p>
                    <Badge tone={required ? "brand" : "neutral"}>
                      {required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  {required &&
                    (rows.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-4 w-4" aria-hidden /> Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                        <XCircle className="h-4 w-4" aria-hidden /> Not submitted
                      </span>
                    ))}
                </div>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Not provided.</p>
                ) : (
                  <DocList rows={rows} preview={preview} download={download} previewable={previewable} />
                )}
              </Card>
            );
          })}
          {legacy.length > 0 && (
            <Card className="space-y-3">
              <p className="font-semibold text-foreground">Other documents</p>
              <DocList
                rows={legacy}
                preview={preview}
                download={download}
                previewable={previewable}
                labelFor={(t) => LEGACY_DOC_LABELS[t] ?? t}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Prior decision */}
      {a.status === "changes_requested" && a.admin_feedback && (
        <Card className="border-warning/40 bg-warning/5">
          <p className="text-sm font-semibold text-foreground">Changes requested</p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
            {a.admin_feedback}
          </p>
        </Card>
      )}
      {a.status === "rejected" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <p className="text-sm font-semibold text-foreground">Rejected</p>
          {a.rejection_reason && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
              {a.rejection_reason}
            </p>
          )}
        </Card>
      )}

      {/* Decision controls */}
      {!decided && (
        <Card className="space-y-6">
          <h2 className="text-lg font-bold text-foreground">Decision</h2>

          <form action={approveApplicant} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Approve application</p>
              <p className="text-sm text-muted-foreground">
                Creates the tutor&apos;s login, moves their documents, and emails
                a set-password link.
              </p>
            </div>
            <input type="hidden" name="id" value={a.id} />
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Approve
            </Button>
          </form>

          <form action={requestChanges} className="space-y-2 border-t border-border pt-5">
            <p className="font-semibold text-foreground">Request changes</p>
            <Textarea
              name="feedback"
              required
              placeholder="Tell the applicant what to fix or add…"
            />
            <input type="hidden" name="id" value={a.id} />
            <Button type="submit" variant="outline">
              Request changes
            </Button>
          </form>

          <form action={rejectApplicant} className="space-y-2 border-t border-border pt-5">
            <p className="font-semibold text-foreground">Reject application</p>
            <Textarea
              name="reason"
              placeholder="Optional reason (included in the email to the applicant)…"
            />
            <input type="hidden" name="id" value={a.id} />
            <Button
              type="submit"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4" aria-hidden /> Reject
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function DocList({
  rows,
  preview,
  download,
  previewable,
  labelFor,
}: {
  rows: DocRow[];
  preview: Map<string, string>;
  download: Map<string, string>;
  previewable: (r: DocRow) => boolean | undefined;
  labelFor?: (t: string) => string;
}) {
  return (
    <ul className="divide-y divide-border border-t border-border">
      {rows.map((d) => (
        <li key={d.id} className="flex items-center gap-3 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {d.file_name ?? "Document"}
            </p>
            <p className="text-xs text-muted-foreground">
              {labelFor ? `${labelFor(d.doc_type)} · ` : ""}
              {formatOf(d)} · {prettyDate(d.created_at)}
            </p>
          </div>
          {previewable(d) && preview.get(d.id) && (
            <a
              href={preview.get(d.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden /> Preview
            </a>
          )}
          {download.get(d.id) && (
            <a
              href={download.get(d.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" aria-hidden /> Download
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
