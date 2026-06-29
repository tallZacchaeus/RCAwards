"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/api";
import type { FormField } from "@/lib/forms/types";
import { cn } from "@/lib/utils";

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
  const accept = field.accept?.join(",");

  async function handleFile(file: File) {
    setStatus("uploading");
    try {
      const { url } = await uploadFile(file);
      setName(file.name);
      onUploaded(url, file.name);
      setStatus("idle");
    } catch {
      setStatus("error");
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
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
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
            <Upload className="h-4 w-4" />
            {status === "error" ? "Upload failed — try again" : "Click to upload"}
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
