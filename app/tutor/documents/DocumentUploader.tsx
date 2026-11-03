"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { uploadDocument } from "./actions";
import { DOC_TYPE_MAP, MAX_DOC_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Uploads one verification document via the `uploadDocument` server action
 *  (which re-validates on the backend). Does a fast client-side check first so
 *  the user gets immediate feedback. */
export function DocumentUploader({
  docType,
  replace = false,
}: {
  docType: string;
  /** Render as "Replace" when a single-file slot already has a file. */
  replace?: boolean;
}) {
  const spec = DOC_TYPE_MAP[docType];
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function extOf(name: string) {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // Frontend validation (the server repeats these checks).
    if (file.size > MAX_DOC_BYTES) {
      setError("Please keep files under 5 MB.");
      e.target.value = "";
      return;
    }
    if (spec && !spec.exts.includes(extOf(file.name))) {
      setError(`Must be a ${spec.exts.join(", ").toUpperCase()} file.`);
      e.target.value = "";
      return;
    }

    const fd = new FormData();
    fd.set("doc_type", docType);
    fd.set("file", file);

    startTransition(async () => {
      const res = await uploadDocument({ ok: false }, fd);
      if (!res.ok) setError(res.error ?? "Upload failed.");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors disabled:opacity-60",
          replace
            ? "border-border text-foreground hover:bg-muted"
            : "border-primary text-primary hover:bg-primary/10"
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : replace ? (
          <RefreshCw className="h-4 w-4" aria-hidden />
        ) : (
          <Upload className="h-4 w-4" aria-hidden />
        )}
        {pending ? "Uploading…" : replace ? "Replace" : "Upload"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={spec?.accept}
        className="sr-only"
        onChange={onFile}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
