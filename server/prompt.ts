import { FIELD_PRESETS } from "../src/utils/fieldPresets";
import {
  AI_DRAFT_LIMITS,
  OPTION_PRESET_KEYS,
  PLACEHOLDER_PRESET_KEYS,
  RANGE_PRESET_KEYS,
  ROWS_PRESET_KEYS,
} from "../src/types/aiFormDraft";

/**
 * The system prompt, assembled from the same preset list the builder uses.
 *
 * Hand-writing the field kinds here would guarantee they drift from FIELD_PRESETS eventually, and
 * the failure would be silent: the model would happily emit a kind the app no longer supports. Both
 * this menu and the validation schema are generated from that one list.
 */

/** One line per field kind: what it is for, and which optional properties it accepts. */
function describePreset(key: string): string {
  const extras: string[] = [];
  if (OPTION_PRESET_KEYS.includes(key as never)) extras.push("options (required, 1-20 items)");
  if (PLACEHOLDER_PRESET_KEYS.includes(key as never)) extras.push("placeholder");
  if (ROWS_PRESET_KEYS.includes(key as never)) extras.push("rows (1-20)");
  if (RANGE_PRESET_KEYS.includes(key as never)) extras.push("min, max");

  const label = FIELD_PRESETS.find((preset) => preset.key === key)?.paletteLabel ?? key;
  return `- "${key}" (${label})${extras.length > 0 ? `: accepts ${extras.join(", ")}` : ""}`;
}

export function buildSystemPrompt(): string {
  return [
    "You design form structures for SchemaCraft, a JSON Schema form builder.",
    "",
    "Reply with ONE JSON object and nothing else. No markdown, no code fences, no explanation.",
    "",
    "Shape:",
    '{ "name": string, "description"?: string, "columns"?: 1|2|3, "fields": [ ... ] }',
    "",
    "Each entry of `fields`:",
    '{ "key": string, "title": string, "name"?: string, "required"?: boolean, ... }',
    "",
    "`key` must be exactly one of these field kinds:",
    FIELD_PRESETS.map((preset) => describePreset(preset.key)).join("\n"),
    "",
    "Rules:",
    `- Produce between ${AI_DRAFT_LIMITS.minFields} and ${AI_DRAFT_LIMITS.maxFields} fields.`,
    '- Every field needs a "key" and a short "title".',
    '- "name" is optional, lowercase snake_case ASCII; it is normalized and de-duplicated anyway.',
    '- Only include properties the chosen kind accepts. Never add other keys.',
    '- Use "select" or "radio" when the user lists the allowed answers, and give them "options".',
    "- Never emit JSON Schema, uiSchema, ids, timestamps or layout objects.",
    `- Keep every title under ${AI_DRAFT_LIMITS.maxTitleLength} characters.`,
    "- Write titles and placeholders in the same language the user wrote their request in.",
    "- Choose columns only when the request implies density; otherwise omit it.",
    "",
    "Example request: a contact form with a name, an email and a message",
    'Example reply: {"name":"Contact form","fields":[{"key":"text","title":"Name","required":true},'
      + '{"key":"email","title":"Email","required":true},{"key":"textarea","title":"Message","rows":4}]}',
  ].join("\n");
}
