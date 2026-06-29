/* Client-side validation, mirroring backend/app/schemas/validation.py.
   The backend re-validates on submit — this is for instant UX feedback. */

import {
  type Answers,
  type FieldErrors,
  type FormDefinition,
  type FormField,
  allFields,
  isOtherOption,
  OTHER_SUFFIX,
} from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && !value.trim());
}

function validateField(field: FormField, answers: Answers, errors: FieldErrors): void {
  const value = answers[field.key];

  if (isEmpty(value)) {
    if (field.required) errors[field.key] = "This field is required.";
    return;
  }

  switch (field.type) {
    case "short_text":
    case "paragraph":
      if (field.max_words && wordCount(String(value)) > field.max_words) {
        errors[field.key] = `Please keep this under ${field.max_words} words.`;
      }
      break;
    case "email":
      if (!EMAIL_RE.test(String(value))) errors[field.key] = "Enter a valid email address.";
      break;
    case "phone":
      if (String(value).replace(/\D/g, "").length < 7) {
        errors[field.key] = "Enter a valid phone number.";
      }
      break;
    case "yes_no":
      if (!["yes", "no"].includes(String(value).toLowerCase())) {
        errors[field.key] = "Choose Yes or No.";
      }
      break;
    case "linear_scale_1_10": {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        errors[field.key] = "Choose a rating from 1 to 10.";
      }
      break;
    }
    case "multiple_choice":
    case "dropdown": {
      const options = field.options ?? [];
      if (!options.includes(String(value))) {
        errors[field.key] = "Choose one of the provided options.";
      } else if (field.allow_other && isOtherOption(String(value))) {
        const other = answers[field.key + OTHER_SUFFIX];
        if (isEmpty(other)) errors[field.key + OTHER_SUFFIX] = "Please specify.";
      }
      break;
    }
    case "region_select":
      if (isEmpty(value)) errors[field.key] = "Select a region.";
      break;
    case "file_upload":
      break;
  }
}

export function validateForm(form: FormDefinition, answers: Answers): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of allFields(form)) validateField(field, answers, errors);
  return errors;
}
