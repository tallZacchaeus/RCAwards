"use client";

import type { AnswerValue, FormField } from "@/lib/forms/types";
import { isOtherOption } from "@/lib/forms/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LinearScale } from "./linear-scale";
import { FileUploadField } from "./file-upload-field";

type Props = {
  field: FormField;
  value: AnswerValue;
  otherValue: AnswerValue;
  fileUrl?: string;
  error?: string;
  otherError?: string;
  onChange: (value: AnswerValue) => void;
  onOtherChange: (value: string) => void;
  onFile: (url: string | undefined, filename?: string) => void;
};

export function FieldRenderer({
  field,
  value,
  otherValue,
  fileUrl,
  error,
  otherError,
  onChange,
  onOtherChange,
  onFile,
}: Props) {
  const invalid = Boolean(error);
  const showOther =
    field.allow_other && typeof value === "string" && isOtherOption(value);
  const labelId = `${field.key}-label`;
  const errorId = `${field.key}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    // id on the wrapper gives every field type (incl. radio/scale/upload) a stable
    // scroll/focus target for validation, and a group naming anchor for AT.
    <div id={`field-${field.key}`} className="flex flex-col gap-2.5">
      <Label htmlFor={field.key} id={labelId}>
        <span>{field.label}</span>
        {field.required && <span className="text-gold">*</span>}
      </Label>
      {field.help && <p className="-mt-1 text-xs text-ink-muted">{field.help}</p>}

      {renderControl()}

      {showOther && (
        <div className="mt-1">
          <Input
            placeholder="Please specify…"
            value={(otherValue as string) ?? ""}
            aria-invalid={Boolean(otherError)}
            aria-describedby={otherError ? `${field.key}__other-error` : undefined}
            onChange={(e) => onOtherChange(e.target.value)}
          />
          {otherError && (
            <p id={`${field.key}__other-error`} role="alert" className="mt-1 text-xs text-red-400">
              {otherError}
            </p>
          )}
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );

  function renderControl() {
    switch (field.type) {
      case "paragraph":
        return (
          <Textarea
            id={field.key}
            name={field.key}
            value={(value as string) ?? ""}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            placeholder={field.max_words ? `Max ${field.max_words} words` : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "yes_no":
        return (
          <RadioGroup
            aria-labelledby={labelId}
            aria-describedby={describedBy}
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(v)}
          >
            {["Yes", "No"].map((opt) => (
              <RadioGroupItem key={opt} id={`${field.key}-${opt}`} value={opt}>
                {opt}
              </RadioGroupItem>
            ))}
          </RadioGroup>
        );

      case "multiple_choice":
        return (
          <RadioGroup
            aria-labelledby={labelId}
            aria-describedby={describedBy}
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(v)}
          >
            {(field.options ?? []).map((opt) => (
              <RadioGroupItem key={opt} id={`${field.key}-${opt}`} value={opt}>
                {opt}
              </RadioGroupItem>
            ))}
          </RadioGroup>
        );

      case "dropdown":
        return (
          <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)}>
            <SelectTrigger id={field.key} aria-invalid={invalid} aria-describedby={describedBy}>
              <SelectValue placeholder="Select one…" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "linear_scale_1_10":
        return (
          <div role="group" aria-labelledby={labelId} aria-describedby={describedBy}>
            <LinearScale
              value={value as number | undefined}
              invalid={invalid}
              onChange={(n) => onChange(n)}
            />
          </div>
        );

      case "file_upload":
        return <FileUploadField field={field} url={fileUrl} onUploaded={onFile} />;

      case "email":
        return (
          <Input
            id={field.key}
            name={field.key}
            type="email"
            autoComplete="email"
            value={(value as string) ?? ""}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            placeholder="you@example.com"
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "phone":
        return (
          <Input
            id={field.key}
            name={field.key}
            type="tel"
            autoComplete="tel"
            value={(value as string) ?? ""}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      default:
        // short_text, region_select
        return (
          <Input
            id={field.key}
            name={field.key}
            value={(value as string) ?? ""}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  }
}
