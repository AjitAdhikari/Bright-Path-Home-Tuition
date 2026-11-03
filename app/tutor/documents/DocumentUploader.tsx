"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Uploads one verification document to the private `tutor-documents` bucket
 *  and records it. Storage + RLS both scope writes to the tutor's own folder. */
export function DocumentUploader({
  docType,
  userId,
}: {
  docType: string;
  userId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Please keep files under 5 MB.");
      return;
    }

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${userId}/${docType}-${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("tutor-documents")
      .upload(path, file);
    if (upErr) {
      setError("Upload failed. Please try again.");
      setBusy(false);
      return;
    }

    const { error: insErr } = await supabase
      .from("tutor_documents")
      .insert({ tutor_id: userId, doc_type: docType, storage_path: path } as never);
    if (insErr) {
      setError("Saved the file but couldn't record it. Please retry.");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
        )}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Upload className="h-4 w-4" aria-hidden />
        )}
        {busy ? "Uploading…" : "Upload"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={onFile}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
