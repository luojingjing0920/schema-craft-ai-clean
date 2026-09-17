import type { Field } from "../types/field";
import type { FormDefinition } from "../types/formDefinition";
import type { AIFieldDraft, AIFormDraft } from "../types/aiFormDraft";
import {
  AI_DRAFT_LIMITS,
  OPTION_PRESET_KEYS,
  PLACEHOLDER_PRESET_KEYS,
  RANGE_PRESET_KEYS,
  ROWS_PRESET_KEYS,
} from "../types/aiFormDraft";
import { createFormDefinition } from "./formDefinition";
import { findPreset } from "./fieldPresets";
import { SEEDED_OPTIONS } from "./fieldTypeChange";
import { defaultField } from "./utils";

/** Turns arbitrary text into a lowercase snake_case identifier that is safe as a schema property. */
export function slugifyFieldName(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, AI_DRAFT_LIMITS.maxNameLength)
    .replace(/_+$/g, "");
  return slug;
}

/** `name`, `name_2`, `name_3` … — the app owns uniqueness, not the model. */
export function uniqueFieldName(proposed: string, taken: string[]): string {
  const base = proposed === "" ? "field" : proposed;
  if (!taken.includes(base)) return base;

  let suffix = 2;
  while (taken.includes(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
}

/** Trim, drop empties, drop duplicates, keep order. Falls back to the seeded option when empty. */
export function normalizeOptions(options: string[] | undefined): string[] {
  const cleaned = (options ?? [])
    .map((option) => option.trim())
    .filter((option) => option !== "")
    .slice(0, AI_DRAFT_LIMITS.maxOptions);

  const unique = [...new Set(cleaned)];
  return unique.length > 0 ? unique : [...SEEDED_OPTIONS];
}

/** Only what the preset can hold is copied over, so a stray property cannot reach the model. */
function draftToField(fieldDraft: AIFieldDraft, name: string): Field {
  // defaultField seeds a legal field for this preset: type axes, title, placeholder, options.
  const preset = findPreset(fieldDraft.key);
  if (!preset) throw new Error(`unknown preset: ${fieldDraft.key}`);
  const field = defaultField(preset);

  const next: Field = {
    ...field,
    name,
    title: fieldDraft.title.trim() || field.title,
    required: fieldDraft.required ?? false,
  };

  if (PLACEHOLDER_PRESET_KEYS.includes(fieldDraft.key) && fieldDraft.placeholder !== undefined) {
    next.placeholder = fieldDraft.placeholder.trim();
  }

  if (OPTION_PRESET_KEYS.includes(fieldDraft.key)) {
    next.options = normalizeOptions(fieldDraft.options);
  }

  if (ROWS_PRESET_KEYS.includes(fieldDraft.key) && fieldDraft.rows !== undefined) {
    // The schema already bounds rows; this guards a caller that skipped validation.
    next.rows = Math.min(Math.max(Math.trunc(fieldDraft.rows), 1), AI_DRAFT_LIMITS.maxRows);
  }

  if (RANGE_PRESET_KEYS.includes(fieldDraft.key)) {
    const { min, max } = fieldDraft;
    // An inverted range is meaningless, so it is dropped rather than silently swapped.
    if (min !== undefined && max !== undefined && min > max) {
      next.minimum = undefined;
      next.maximum = undefined;
    } else {
      next.minimum = min;
      next.maximum = max;
    }
  }

  return next;
}

/**
 * `AIFormDraft -> FormDefinition`, the one place a draft becomes something the app can hold.
 *
 * Everything the app owns — the form id, every field id, the timestamps, the layout defaults and
 * the empty reaction list — comes from `createFormDefinition` / `defaultField`, so a generated form
 * is indistinguishable from a hand-built one from here on. The draft is never mutated.
 */
export function createFormDefinitionFromAIDraft(draft: AIFormDraft): FormDefinition {
  const base = createFormDefinition();

  const takenNames: string[] = [];
  const fields = draft.fields.map((fieldDraft) => {
    const proposed = slugifyFieldName(fieldDraft.name ?? fieldDraft.title);
    const name = uniqueFieldName(proposed, takenNames);
    takenNames.push(name);
    return draftToField(fieldDraft, name);
  });

  const columns = draft.columns;
  const validColumns =
    columns !== undefined &&
    Number.isInteger(columns) &&
    columns >= 1 &&
    columns <= AI_DRAFT_LIMITS.maxColumns;

  return {
    ...base,
    name: draft.name.trim() || base.name,
    description: draft.description?.trim() ?? base.description,
    fields,
    layout: { ...base.layout, columns: validColumns ? (columns as 1 | 2 | 3) : base.layout.columns },
    reactions: [],
  };
}
