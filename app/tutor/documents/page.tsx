import { CheckCircle2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { DocumentUploader } from "./DocumentUploader";

const DOC_TYPES = [
  {
    type: "citizenship",
    label: "Citizenship / National ID",
    note: "Required",
  },
  {
    type: "certificate",
    label: "Latest academic certificate",
    note: "Required",
  },
  {
    type: "police_report",
    label: "Police character report",
    note: "Optional — for teaching young children",
  },
  {
    type: "experience_letter",
    label: "Teaching experience letter",
    note: "Optional",
  },
] as const;

type DocRow = { id: string; doc_type: string; review_status: string };

export default async function Documents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("tutor_documents")
    .select("id, doc_type, review_status")
    .eq("tutor_id", user?.id ?? "");

  const docs = (data ?? []) as DocRow[];
  const uploaded = new Set(docs.map((d) => d.doc_type));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          Verification documents
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, JPG or PNG · up to 5 MB each. Only Bright Path admins can see
          these — never other tutors or parents.
        </p>
      </div>

      {DOC_TYPES.map((doc) => (
        <Card key={doc.type} className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">{doc.label}</p>
            <p className="text-xs text-muted-foreground">{doc.note}</p>
          </div>
          {uploaded.has(doc.type) ? (
            <Badge tone="success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Uploaded
            </Badge>
          ) : user ? (
            <DocumentUploader docType={doc.type} userId={user.id} />
          ) : null}
        </Card>
      ))}
    </div>
  );
}
