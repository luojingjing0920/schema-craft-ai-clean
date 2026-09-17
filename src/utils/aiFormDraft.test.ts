import { describe, it, expect } from "vitest";
import { parseAiFormDraft } from "./aiFormDraftSchema";
import {
  createFormDefinitionFromAIDraft,
  normalizeOptions,
  slugifyFieldName,
  uniqueFieldName,
} from "./aiFormDraft";
import { AI_DRAFT_LIMITS, type AIFormDraft } from "../types/aiFormDraft";
import { FIELD_PRESETS } from "./fieldPresets";

// ---------------------------------------------------------------------------
// schema
// ---------------------------------------------------------------------------

describe("AI_FORM_DRAFT_SCHEMA", () => {
  const validDraft = {
    name: "Job application",
    fields: [
      { key: "text", title: "Name", required: true },
      { key: "select", title: "Education", options: ["Bachelor", "Master"] },
    ],
  };

  it("accepts a well-formed draft", () => {
    const result = parseAiFormDraft(validDraft);
    expect(result.ok).toBe(true);
  });

  it("rejects a field kind that is not a preset", () => {
    const result = parseAiFormDraft({
      name: "x",
      fields: [{ key: "signature_pad", title: "Sign" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toContain("allowed values");
  });

  it("rejects an extra key rather than ignoring it", () => {
    const result = parseAiFormDraft({
      name: "x",
      fields: [{ key: "text", title: "Name", dataType: "string" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toContain("additional");
  });

  it("rejects a draft with no fields", () => {
    expect(parseAiFormDraft({ name: "x", fields: [] }).ok).toBe(false);
  });

  it("rejects more fields than the limit", () => {
    const fields = Array.from({ length: AI_DRAFT_LIMITS.maxFields + 1 }, (_, i) => ({
      key: "text",
      title: `Field ${i}`,
    }));
    expect(parseAiFormDraft({ name: "x", fields }).ok).toBe(false);
  });

  it("rejects wrong types", () => {
    expect(parseAiFormDraft({ name: 42, fields: [] }).ok).toBe(false);
    expect(parseAiFormDraft({ name: "x", fields: "nope" }).ok).toBe(false);
    expect(parseAiFormDraft({ name: "x", fields: [{ key: "text" }] }).ok).toBe(false);
    expect(parseAiFormDraft(null).ok).toBe(false);
  });

  it("rejects a field name or title that is too long", () => {
    const long = "a".repeat(AI_DRAFT_LIMITS.maxTitleLength + 1);
    expect(parseAiFormDraft({ name: "x", fields: [{ key: "text", title: long }] }).ok).toBe(false);
  });

  it("rejects columns outside 1..3", () => {
    const base = { name: "x", fields: [{ key: "text", title: "T" }] };
    expect(parseAiFormDraft({ ...base, columns: 4 }).ok).toBe(false);
    expect(parseAiFormDraft({ ...base, columns: 0 }).ok).toBe(false);
    expect(parseAiFormDraft({ ...base, columns: 2 }).ok).toBe(true);
  });

  it("accepts every preset key the builder knows", () => {
    const fields = FIELD_PRESETS.map((preset) => ({
      key: preset.key,
      title: preset.label,
      ...(preset.key === "select" || preset.key === "radio" ? { options: ["A"] } : {}),
    }));
    const result = parseAiFormDraft({ name: "all kinds", fields });
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// normalization helpers
// ---------------------------------------------------------------------------

describe("slugifyFieldName", () => {
  it("produces a lowercase snake_case identifier", () => {
    expect(slugifyFieldName("Expected Salary")).toBe("expected_salary");
    expect(slugifyFieldName("  Work  Experience!! ")).toBe("work_experience");
    expect(slugifyFieldName("Café #2")).toBe("caf_2");
  });

  it("never returns a trailing underscore, even when truncated", () => {
    const slug = slugifyFieldName("a".repeat(AI_DRAFT_LIMITS.maxNameLength) + " b");
    expect(slug.endsWith("_")).toBe(false);
    expect(slug.length).toBeLessThanOrEqual(AI_DRAFT_LIMITS.maxNameLength);
  });

  it("returns an empty string when there is nothing usable", () => {
    expect(slugifyFieldName("!!!")).toBe("");
  });
});

describe("uniqueFieldName", () => {
  it("keeps a free name and suffixes a taken one", () => {
    expect(uniqueFieldName("email", [])).toBe("email");
    expect(uniqueFieldName("email", ["email"])).toBe("email_2");
    expect(uniqueFieldName("email", ["email", "email_2"])).toBe("email_3");
  });

  it("falls back to a usable name when the proposal is empty", () => {
    expect(uniqueFieldName("", [])).toBe("field");
  });
});

describe("normalizeOptions", () => {
  it("trims, drops empties and dedupes, keeping order", () => {
    expect(normalizeOptions(["  A ", "B", "", "A", "   ", "C"])).toEqual(["A", "B", "C"]);
  });

  it("falls back to the seeded option rather than producing an empty select", () => {
    expect(normalizeOptions([])).toEqual(["Option 1"]);
    expect(normalizeOptions(undefined)).toEqual(["Option 1"]);
    expect(normalizeOptions(["  ", ""])).toEqual(["Option 1"]);
  });
});

// ---------------------------------------------------------------------------
// conversion
// ---------------------------------------------------------------------------

describe("createFormDefinitionFromAIDraft", () => {
  const draft: AIFormDraft = {
    name: "Job Application",
    description: "Apply here",
    columns: 2,
    fields: [
      { key: "text", title: "Full Name", required: true },
      { key: "email", title: "Email" },
      { key: "number", title: "Age", min: 18, max: 99 },
      { key: "select", title: "Education", options: [" Bachelor ", "Master", "Bachelor"] },
      { key: "textarea", title: "Work Experience", rows: 4 },
    ],
  };

  it("builds a complete FormDefinition from the app's own defaults", () => {
    const def = createFormDefinitionFromAIDraft(draft);

    expect(def.id).not.toBe("");
    expect(def.createdAt).toBe(def.updatedAt);
    expect(def.reactions).toEqual([]);
    expect(def.layout.columns).toBe(2);
    expect(def.layout.showSubmitButton).toBe(true);
    expect(def.layout.labelPosition).toBe("top");
    expect(def.name).toBe("Job Application");
    expect(def.description).toBe("Apply here");
    expect(def.fields).toHaveLength(5);
  });

  it("gives every field a fresh id and a unique name", () => {
    const def = createFormDefinitionFromAIDraft(draft);
    const ids = def.fields.map((field) => field.id);
    const names = def.fields.map((field) => field.name);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(["full_name", "email", "age", "education", "work_experience"]);
  });

  it("maps each draft key onto the matching preset's type axes", () => {
    const def = createFormDefinitionFromAIDraft(draft);
    const byName = Object.fromEntries(def.fields.map((field) => [field.name, field]));

    expect(byName.email.format).toBe("email");
    expect(byName.age.dataType).toBe("number");
    expect(byName.education.widget).toBe("select");
    expect(byName.work_experience.widget).toBe("textarea");
  });

  it("applies only the properties the preset can hold", () => {
    const def = createFormDefinitionFromAIDraft({
      name: "x",
      fields: [
        { key: "text", title: "Name", rows: 5, min: 1, options: ["ignored"] },
        { key: "textarea", title: "Notes", rows: 5, placeholder: "  say more  " },
      ],
    });

    expect(def.fields[0].rows).toBeUndefined();
    expect(def.fields[0].minimum).toBeUndefined();
    expect(def.fields[0].options).toBeUndefined();
    expect(def.fields[1].rows).toBe(5);
    expect(def.fields[1].placeholder).toBe("say more");
  });

  it("normalizes options and guarantees a non-empty list for enum kinds", () => {
    const def = createFormDefinitionFromAIDraft({
      name: "x",
      fields: [
        { key: "select", title: "Education", options: [" Bachelor ", "Master", "Bachelor"] },
        { key: "radio", title: "Shift" },
      ],
    });

    expect(def.fields[0].options).toEqual(["Bachelor", "Master"]);
    expect(def.fields[1].options).toEqual(["Option 1"]);
  });

  it("drops an inverted range instead of swapping it", () => {
    const def = createFormDefinitionFromAIDraft({
      name: "x",
      fields: [{ key: "number", title: "Age", min: 99, max: 18 }],
    });
    expect(def.fields[0].minimum).toBeUndefined();
    expect(def.fields[0].maximum).toBeUndefined();
  });

  it("keeps a valid range", () => {
    const def = createFormDefinitionFromAIDraft({
      name: "x",
      fields: [{ key: "number", title: "Age", min: 18, max: 99 }],
    });
    expect(def.fields[0].minimum).toBe(18);
    expect(def.fields[0].maximum).toBe(99);
  });

  it("falls back to the default layout when columns is missing or out of range", () => {
    const one = { key: "text" as const, title: "T" };
    expect(createFormDefinitionFromAIDraft({ name: "x", fields: [one] }).layout.columns).toBe(1);
    expect(
      createFormDefinitionFromAIDraft({ name: "x", columns: 9, fields: [one] }).layout.columns
    ).toBe(1);
  });

  it("derives a name from the title when the model omits one", () => {
    const def = createFormDefinitionFromAIDraft({
      name: "x",
      fields: [{ key: "text", title: "Expected Salary" }],
    });
    expect(def.fields[0].name).toBe("expected_salary");
  });

  it("disambiguates duplicate names", () => {
    const def = createFormDefinitionFromAIDraft({
      name: "x",
      fields: [
        { key: "text", title: "Email" },
        { key: "text", title: "Email" },
        { key: "text", title: "Email" },
      ],
    });
    expect(def.fields.map((field) => field.name)).toEqual(["email", "email_2", "email_3"]);
  });

  it("never mutates the draft it was given", () => {
    const input: AIFormDraft = {
      name: "Job Application",
      columns: 2,
      fields: [{ key: "select", title: "Education", options: [" Bachelor ", "Bachelor"] }],
    };
    const snapshot = JSON.stringify(input);

    createFormDefinitionFromAIDraft(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("gives two conversions of the same draft different identities", () => {
    const a = createFormDefinitionFromAIDraft(draft);
    const b = createFormDefinitionFromAIDraft(draft);
    expect(a.id).not.toBe(b.id);
    expect(a.fields[0].id).not.toBe(b.fields[0].id);
  });
});
