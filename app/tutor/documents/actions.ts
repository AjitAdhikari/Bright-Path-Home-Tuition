"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPE_MAP } from "@/lib/constants";
import { safeStorageName, validateDocFile } from "@/lib/uploads";

export type DocActionState = { ok: boolean; error?: string; message?: string };

/**
 * Upload one verification document. Validation runs on the SERVER (type,
 * extension, size) so a crafted request can't bypass the browser checks. The
 * file is stored in the private `tutor-documents` bucket under the tutor's own
 * folder; RLS + storage policies also scope every write to the owner.
 */
export async function uploadDocument(
  _prev: DocActionState,
  formData: FormData
): Promise<DocActionState> {
  const docType = String(formData.get("doc_type") ?? "");
  const spec = DOC_TYPE_MAP[docType];
  if (!spec) return { ok: false, error: "Unknown document type." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const fileErr = validateDocFile(docType, file);
  if (fileErr) return { ok: false, error: fileErr };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  // Single-file types behave as "replace": clear the previous file first.
  if (!spec.multiple) {
    const { data: existing } = await supabase
      .from("tutor_documents")
      .select("id, storage_path")
      .eq("tutor_id", user.id)
      .eq("doc_type", docType);
    const rows = (existing ?? []) as { id: string; storage_path: string }[];
    if (rows.length) {
      await supabase.storage
        .from("tutor-documents")
        .remove(rows.map((r) => r.storage_path));
      await supabase
        .from("tutor_documents")
        .delete()
        .in(
          "id",
          rows.map((r) => r.id)
        );
    }
  }

  const safeName = safeStorageName(file.name);
  const path = `${user.id}/${docType}-${Date.now()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from("tutor-documents")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) return { ok: false, error: "Upload failed. Please try again." };

  const { error: insErr } = await supabase.from("tutor_documents").insert({
    tutor_id: user.id,
    doc_type: docType,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
  } as never);
  if (insErr) {
    // roll back the orphaned object so we don't leave a file with no row
    await supabase.storage.from("tutor-documents").remove([path]);
    return { ok: false, error: "Saved the file but couldn't record it. Please retry." };
  }

  revalidatePath("/tutor/documents");
  return { ok: true, message: `${spec.label} uploaded.` };
}

/** Remove a single uploaded document (file + row). RLS confines this to the
 *  owning tutor (or an admin). Plain form-action signature. */
export async function deleteDocument(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tutor_documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  const row = data as { storage_path: string } | null;
  if (row?.storage_path) {
    await supabase.storage.from("tutor-documents").remove([row.storage_path]);
  }
  await supabase.from("tutor_documents").delete().eq("id", id);

  revalidatePath("/tutor/documents");
}

/**
 * Final submission gate. A tutor cannot submit for review without a valid
 * CV/Resume — enforced on the server, not just by a disabled button.
 */
export async function submitForReview(): Promise<DocActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { count } = await supabase
    .from("tutor_documents")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", user.id)
    .eq("doc_type", "cv");

  if (!count) {
    return {
      ok: false,
      error: "Please upload your CV/Resume before submitting your application.",
    };
  }

  await supabase
    .from("tutor_applications")
    .update({ status: "pending_review", submitted_at: new Date().toISOString() } as never)
    .eq("tutor_id", user.id)
    .in("status", ["pending_review", "changes_requested"]);

  revalidatePath("/tutor/application-status");
  revalidatePath("/tutor/documents");
  return { ok: true, message: "Application submitted for review." };
}
