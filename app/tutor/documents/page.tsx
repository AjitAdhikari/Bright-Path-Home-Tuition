import { CheckCircle2, FileText, ExternalLink, Trash2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPES } from "@/lib/constants";
import { DocumentUploader } from "./DocumentUploader";
import { deleteDocument } from "./actions";
import { SubmitBar } from "./SubmitBar";

type DocRow = {
  id: string;
  doc_type: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
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

export default async function Documents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("tutor_documents")
    .select("id, doc_type, storage_path, file_name, mime_type, size_bytes, created_at")
    .eq("tutor_id", user?.id ?? "")
    .order("created_at", { ascending: true });

  const docs = (data ?? []) as DocRow[];

  // Pre-sign preview URLs (private bucket; the owner may read their own files).
  const signed = new Map<string, string>();
  await Promise.all(
    docs.map(async (d) => {
      const { data: s } = await supabase.storage
        .from("tutor-documents")
        .createSignedUrl(d.storage_path, 60 * 60);
      if (s?.signedUrl) signed.set(d.id, s.signedUrl);
    })
  );

  const byType = (t: string) => docs.filter((d) => d.doc_type === t);
  const hasCv = byType("cv").length > 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          Verification documents
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Up to 5 MB each. Only Bright Path admins can see these — never other
          tutors or parents. A valid CV/Resume is required before you can submit
          your application for review.
        </p>
      </div>

      {DOC_TYPES.map((spec) => {
        const uploaded = byType(spec.type);
        const required = spec.requirement === "required";
        const singleFilled = !spec.multiple && uploaded.length > 0;

        return (
          <Card key={spec.type} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{spec.label}</p>
                  <Badge tone={required ? "brand" : "neutral"}>
                    {required ? "Required" : "Optional"}
                  </Badge>
                  {required && uploaded.length > 0 && (
                    <CheckCircle2
                      className="h-4 w-4 text-success"
                      aria-label="Submitted"
                    />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{spec.note}</p>
              </div>
              {/* Hide the uploader for a filled single-file slot except as "Replace". */}
              {(spec.multiple || !singleFilled) && (
                <DocumentUploader docType={spec.type} />
              )}
            </div>

            {uploaded.length > 0 && (
              <ul className="divide-y divide-border border-t border-border">
                {uploaded.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 py-3 first:pt-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <FileText className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {d.file_name ?? "Document"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatOf(d)} · {prettyDate(d.created_at)}
                      </p>
                    </div>
                    {signed.get(d.id) && (
                      <a
                        href={signed.get(d.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Preview
                      </a>
                    )}
                    {!spec.multiple ? (
                      <DocumentUploader docType={spec.type} replace />
                    ) : null}
                    <form action={deleteDocument}>
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        aria-label="Remove document"
                        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      <SubmitBar hasCv={hasCv} />
    </div>
  );
}
