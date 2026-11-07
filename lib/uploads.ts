import "server-only";
import { DOC_TYPE_MAP, MAX_DOC_BYTES } from "@/lib/constants";

/** Lowercase file extension without the dot ("" if none). */
export function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Storage-safe basename — strips anything outside [A-Za-z0-9.-_], which also
 *  neutralises path separators and traversal sequences. */
export function safeStorageName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Server-side validation for an uploaded verification document. Returns an
 * error message, or null when the file is acceptable. A file of size 0 is
 * treated as "not provided" (caller decides whether that's required).
 *
 * The check is deliberately strict: the extension must be in the allowlist AND,
 * when the browser sent a MIME type, that type must be allowed too (an empty
 * MIME is tolerated because some clients omit it). This is the single source of
 * truth shared by the public application form and the tutor document uploader.
 */
export function validateDocFile(docType: string, file: File): string | null {
  const spec = DOC_TYPE_MAP[docType];
  if (!spec) return "Unknown document type.";
  if (file.size === 0) return null;
  if (file.size > MAX_DOC_BYTES) return `${spec.label} must be under 5 MB.`;

  const ext = extOf(file.name);
  const extOk = spec.exts.includes(ext);
  const mimeOk = !file.type || spec.mimes.includes(file.type);
  if (!extOk || !mimeOk) {
    return `${spec.label} must be a ${spec.exts.join(", ").toUpperCase()} file.`;
  }
  return null;
}
