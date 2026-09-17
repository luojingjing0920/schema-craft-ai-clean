import Ajv, { type ErrorObject } from "ajv";
import { FIELD_PRESETS, type FieldPresetKey } from "./fieldPresets";
import { AI_DRAFT_LIMITS, type AIFormDraft } from "../types/aiFormDraft";

/**
 * The one description of what a valid draft looks like.
 *
 * The same object feeds all three consumers: the server's validation, the client's re-validation,
 * and (when the provider supports it) the structured-output request. Keeping it single is what
 * stops the prompt, the wire contract and the checks from drifting apart.
 *
 * `key` is an enum built from FIELD_PRESETS rather than a hand-written list, so adding a field kind
 * to the builder automatically widens what the model may produce.
 */
const PRESET_KEYS = FIELD_PRESETS.map((preset) => preset.key);

/** Draft fields carry only what the matching preset can actually hold; the rest is app-generated. */
export const AI_FORM_DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "fields"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: AI_DRAFT_LIMITS.maxTitleLength },
    description: { type: "string", maxLength: AI_DRAFT_LIMITS.maxPlaceholderLength },
    columns: { type: "integer", minimum: 1, maximum: AI_DRAFT_LIMITS.maxColumns },
    fields: {
      type: "array",
      minItems: AI_DRAFT_LIMITS.minFields,
      maxItems: AI_DRAFT_LIMITS.maxFields,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "title"],
        properties: {
          key: { type: "string", enum: PRESET_KEYS },
          title: { type: "string", minLength: 1, maxLength: AI_DRAFT_LIMITS.maxTitleLength },
          name: { type: "string", minLength: 1, maxLength: AI_DRAFT_LIMITS.maxNameLength },
          required: { type: "boolean" },
          placeholder: { type: "string", maxLength: AI_DRAFT_LIMITS.maxPlaceholderLength },
          options: {
            type: "array",
            minItems: 1,
            maxItems: AI_DRAFT_LIMITS.maxOptions,
            items: { type: "string", minLength: 1, maxLength: AI_DRAFT_LIMITS.maxOptionLength },
          },
          min: { type: "number" },
          max: { type: "number" },
          rows: { type: "integer", minimum: 1, maximum: AI_DRAFT_LIMITS.maxRows },
        },
      },
    },
  },
} as const;

const ajv = new Ajv({ allErrors: true });
const validateDraft = ajv.compile(AI_FORM_DRAFT_SCHEMA);

export type AiFormDraftParseResult =
  | { ok: true; draft: AIFormDraft }
  | { ok: false; errors: string[] };

/** `fields[2].key: must be equal to one of the allowed values` — readable without decoding AJV. */
function formatError(error: ErrorObject): string {
  const path =
    error.instancePath
      .split("/")
      .filter((segment) => segment !== "")
      // Array indices read better as `fields[2]` than as `fields.2`.
      .reduce((acc, segment) => (/^\d+$/.test(segment) ? `${acc}[${segment}]` : `${acc}.${segment}`), "")
      .replace(/^\./, "") || "draft";

  return `${path}: ${error.message ?? "is invalid"}`;
}

/**
 * `unknown -> AIFormDraft`, or the reasons it is not one.
 *
 * Never a cast: the model's output is untrusted input on both sides of the wire, so the only way to
 * get from `unknown` to the type is to prove it.
 */
export function parseAiFormDraft(value: unknown): AiFormDraftParseResult {
  if (validateDraft(value)) return { ok: true, draft: value as AIFormDraft };
  return { ok: false, errors: (validateDraft.errors ?? []).map(formatError) };
}

/** Re-exported so the server and the prompt builder agree on the legal kinds. */
export const ALLOWED_PRESET_KEYS: FieldPresetKey[] = PRESET_KEYS as FieldPresetKey[];
