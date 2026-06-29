/* Mirrors backend/app/schemas/form_schema.py — the form-definition contract. */

export type FieldType =
  | "short_text"
  | "paragraph"
  | "email"
  | "phone"
  | "multiple_choice"
  | "dropdown"
  | "yes_no"
  | "linear_scale_1_10"
  | "file_upload"
  | "region_select";

export type FormField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  help?: string | null;
  options?: string[] | null;
  allow_other?: boolean;
  max_words?: number | null;
  accept?: string[] | null;
};

export type FormSection = {
  title: string;
  description?: string | null;
  fields: FormField[];
};

export type FormDefinition = {
  slug: string;
  name: string;
  group: string;
  edition_year: number;
  description: string;
  voting_enabled: boolean;
  sort_order: number;
  sections: FormSection[];
};

export type CategoryDetail = {
  slug: string;
  name: string;
  group: string;
  description: string;
  voting_enabled: boolean;
  nominations_open: boolean;
  form: FormDefinition;
};

export type AnswerValue = string | number | undefined;
export type Answers = Record<string, AnswerValue>;
export type FieldErrors = Record<string, string>;

/** A pending/complete file reference attached to a field. */
export type FileRef = {
  field_key: string;
  url: string;
  kind?: string;
};

export const OTHER_SUFFIX = "__other";

export function allFields(form: FormDefinition): FormField[] {
  return form.sections.flatMap((s) => s.fields);
}

export function isOtherOption(option: string): boolean {
  return option.toLowerCase().startsWith("other");
}
