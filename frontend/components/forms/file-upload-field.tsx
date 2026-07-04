"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/api";
import type { FormField } from "@/lib/forms/types";
import { cn } from "@/lib/utils";

// Keep in sync with the backend `max_upload_mb` setting.
const MAX_UPLOAD_MB = 10;

/** True if the browser file matches one of the field's accept patterns
 *  (e.g. "image/*", "application/pdf"). Empty accept → allow anything. */
function matchesAccept(file: File, accept: string[] | null | undefined): boolean {
  if (!accept || accept.length === 0) return true;
  return accept.some((pattern) => {
    if (pattern.endsWith("/*")) return file.type.startsWith(pattern.slice(0, -1));
    return file.type === pattern;
  });
}

function acceptHint(accept: string[] | null | undefined): string {
  if (!accept || accept.length === 0) return `Max ${MAX_UPLOAD_MB} MB.`;
  const labels = accept
    .map((a) => (a === "application/pdf" ? "PDF" : a.replace("/*", "").replace("image", "images").replace("video", "video")))
    .join(", ");
  return `${labels}. Max ${MAX_UPLOAD_MB} MB.`;
}

export function FileUploadField({
  field,
  url,
  onUploaded,
}: {
  field: FormField;
  url: string | undefined;
  onUploaded: (url: string | undefined, filename?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [name, setName] = useState<string>();
  const [errorMsg, setErrorMsg] = useState<string>();
  const accept = field.accept?.join(",");

  async function handleFile(file: File) {
    setErrorMsg(undefined);

    // Client-side pre-checks so the user gets an instant, specific reason instead
    // of uploading a large/unsupported file only to be rejected by the server.
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setStatus("error");
      setErrorMsg(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    if (!matchesAccept(file, field.accept)) {
      setStatus("error");
      setErrorMsg(`That file type isn't accepted. Allowed: ${acceptHint(field.accept)}`);
      return;
    }

    setStatus("uploading");
    try {
      const { url } = await uploadFile(file);
      setName(file.name);
      onUploaded(url, file.name);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      // Surface the server's real reason (e.g. "File exceeds 10 MB limit").
      setErrorMsg((e as Error).message || "Upload failed. Please try again.");
    }
  }

  if (url) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm">
        <span className="truncate text-gold-hi">{name ?? "File attached"}</span>
        <button
          type="button"
          onClick={() => {
            onUploaded(undefined);
            setName(undefined);
            setErrorMsg(undefined);
          }}
          className="ml-3 text-ink-muted hover:text-red-400"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        id={field.key}
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        aria-describedby={errorMsg ? `${field.key}-error` : undefined}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-bg px-4 py-6 text-sm text-ink-muted transition-colors hover:border-gold/50 hover:text-gold",
          status === "error" && "border-red-500/60 text-red-400"
        )}
      >
        {status === "uploading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" /> Click to upload
          </>
        )}
      </button>
      <p className="text-xs text-ink-muted">{acceptHint(field.accept)}</p>
      {errorMsg && (
        <p id={`${field.key}-error`} role="alert" className="text-xs text-red-400">
          {errorMsg}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset the value so selecting the SAME file again re-fires onChange
          // (important for retrying after an error).
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
