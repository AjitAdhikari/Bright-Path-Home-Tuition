import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
} from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import {
  DOC_TYPES,
  LEGACY_DOC_LABELS,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  type ApplicationStatus,
} from "@/lib/constants";

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

function prettyDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TutorApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profileData }, { data: appData }, { data: docData }] =
    await Promise.all([
      supabase
        .from("tutor_profiles")
        .select(
          "education, experience_years, verification_status, profiles(full_name, email, phone)"
        )
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("tutor_applications")
        .select("application_number, status, submitted_at")
        .eq("tutor_id", id)
        .maybeSingle(),
      supabase
        .from("tutor_documents")
        .select("id, doc_type, storage_path, file_name, mime_type, created_at")
        .eq("tutor_id", id)
        .order("created_at", { ascending: true }),
    ]);

  const profile = profileData as
    | {
        education: string | null;
        experience_years: number | null;
        verification_status: string;
        profiles: { full_name: string; email: string | null; phone: string | null } | null;
      }
    | null;
  const app = appData as
    | { application_number: string; status: ApplicationStatus; submitted_at: string | null }
    | null;
  const docs = (docData ?? []) as DocRow[];

  // Admins may read every object in the private bucket (storage RLS), so we can
  // mint short-lived signed URLs for inline preview and forced download.
  const preview = new Map<string, string>();
  const download = new Map<string, string>();
  await Promise.all(
    docs.map(async (d) => {
      const [{ data: p }, { data: dl }] = await Promise.all([
        supabase.storage.from("tutor-documents").createSignedUrl(d.storage_path, 60 * 60),
        supabase.storage
          .from("tutor-documents")
          .createSignedUrl(d.storage_path, 60 * 60, {
            download: d.file_name ?? true,
          }),
      ]);
      if (p?.signedUrl) preview.set(d.id, p.signedUrl);
      if (dl?.signedUrl) download.set(d.id, dl.signedUrl);
    })
  );

  const name = profile?.profiles?.full_name ?? "Tutor";
  const byType = (t: string) => docs.filter((d) => d.doc_type === t);
  // Doc types not in the catalogue (legacy rows) still get listed at the end.
  const known = new Set(DOC_TYPES.map((d) => d.type));
  const legacy = docs.filter((d) => !known.has(d.doc_type));

  function previewable(row: DocRow) {
    return row.mime_type?.includes("pdf") || row.mime_type?.includes("image");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/tutors"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to tutors
      </Link>

      {/* Header */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile?.education ?? "No education on file"}
              {profile?.experience_years
                ? ` · ${profile.experience_years} yrs experience`
                : ""}
            </p>
          </div>
          {app && (
            <div className="text-right">
              <Badge tone={APPLICATION_STATUS_TONE[app.status]}>
                {APPLICATION_STATUS_LABEL[app.status]}
              </Badge>
              <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                {app.application_number}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
          {profile?.profiles?.email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" aria-hidden /> {profile.profiles.email}
            </span>
          )}
          {profile?.profiles?.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-4 w-4" aria-hidden /> {profile.profiles.phone}
            </span>
          )}
          {app?.submitted_at && (
            <span>Submitted {prettyDate(app.submitted_at)}</span>
          )}
        </div>
      </Card>

      {/* Documents */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">Documents</h2>
        <div className="space-y-3">
          {DOC_TYPES.map((spec) => {
            const rows = byType(spec.type);
            const required = spec.requirement === "required";
            const missing = required && rows.length === 0;
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
                  <p className="text-sm text-muted-foreground">
                    {missing
                      ? "This required document has not been uploaded yet."
                      : "Not provided."}
                  </p>
                ) : (
                  <DocList
                    rows={rows}
                    preview={preview}
                    download={download}
                    previewable={previewable}
                  />
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
        <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
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
          <div className="flex basis-full items-center gap-1 sm:basis-auto">
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
          </div>
        </li>
      ))}
    </ul>
  );
}
