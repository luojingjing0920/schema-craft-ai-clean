import type { FieldPresetKey } from "../utils/fieldPresets";

/**
 * What the model is allowed to produce: form intent, and nothing else.
 *
 * A draft never carries identity (`id`), timestamps, `layout`, `dataType`, `widget` or `format`.
 * Identity and defaults belong to the app, and the type axes are implied by `key` — a preset is the
 * only legal combination of the three, so an impossible field kind cannot even be expressed.
 */

export const AI_DRAFT_LIMITS = {
  /** Prompt characters accepted by the server and by the page's textarea. */
  promptMaxLength: 2000,
  minFields: 1,
  maxFields: 20,
  maxTitleLength: 80,
  maxNameLength: 40,
  maxPlaceholderLength: 120,
  maxOptionLength: 60,
  maxOptions: 20,
  maxRows: 20,
  /** Columns a generated form may ask for; 4 is too cramped to be worth offering. */
  maxColumns: 3,
} as const;

export interface AIFieldDraft {
  key: FieldPresetKey;
  title: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  /** select / radio only. */
  options?: string[];
  /** number only. */
  min?: number;
  max?: number;
  /** textarea only. */
  rows?: number;
}

export interface AIFormDraft {
  name: string;
  description?: string;
  columns?: number;
  fields: AIFieldDraft[];
}

/**
 * Why generation did not produce a draft.
 *
 * Lives here rather than in the server module because it describes the wire, and the browser must
 * be able to read it without importing anything that only runs on a server.
 */
export type FormDraftErrorKind =
  | "prompt"
  | "not-configured"
  /** The provider rejected our credentials — a server-side configuration problem. */
  | "auth"
  | "network"
  | "timeout"
  | "rate-limit"
  /** The provider answered with a server error. */
  | "unavailable"
  | "provider"
  | "invalid-json"
  | "invalid-draft";

export interface FormDraftError {
  kind: FormDraftErrorKind;
  message: string;
  /** Schema failures only, already formatted as `path: reason`. */
  errors?: string[];
}

/** The body of POST /api/ai/generate-form, in both directions. */
export type FormDraftResponse =
  | { ok: true; draft: AIFormDraft }
  | { ok: false; error: FormDraftError };

/** Field kinds whose value is one of a fixed list, and which therefore need `options`. */
export const OPTION_PRESET_KEYS: FieldPresetKey[] = ["select", "radio"];

/** Field kinds that accept a placeholder. */
export const PLACEHOLDER_PRESET_KEYS: FieldPresetKey[] = ["text", "email", "password", "textarea"];

/** Field kinds that accept `rows`. */
export const ROWS_PRESET_KEYS: FieldPresetKey[] = ["textarea"];

/** Field kinds that accept `min` / `max`. */
export const RANGE_PRESET_KEYS: FieldPresetKey[] = ["number"];
