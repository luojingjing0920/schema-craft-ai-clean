import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./prompt";
import { FIELD_PRESETS } from "../src/utils/fieldPresets";
import { AI_DRAFT_LIMITS } from "../src/types/aiFormDraft";

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt();

  it("mentions every field kind the builder supports", () => {
    // The menu is generated from FIELD_PRESETS; a new preset that never reaches the prompt would
    // quietly become a field the model can never choose.
    for (const preset of FIELD_PRESETS) {
      expect(prompt).toContain(`"${preset.key}"`);
    }
  });

  it("lists exactly the supported kinds and nothing else", () => {
    // Menu lines are the only ones shaped `- "key" (label)`, which keeps rules bullets out.
    const listed = [...prompt.matchAll(/^- "([a-z_]+)" \(/gm)].map((match) => match[1]);
    expect(listed.sort()).toEqual([...FIELD_PRESETS.map((preset) => preset.key)].sort());
  });

  it("states the contract's limits", () => {
    expect(prompt).toContain(String(AI_DRAFT_LIMITS.maxFields));
    expect(prompt).toContain(String(AI_DRAFT_LIMITS.promptMaxLength > 0 ? AI_DRAFT_LIMITS.maxTitleLength : 0));
  });

  it("forbids the things the app owns", () => {
    expect(prompt).toMatch(/never emit json schema, uischema, ids, timestamps/i);
  });

  it("forbids markdown and prose", () => {
    expect(prompt).toMatch(/no markdown/i);
    expect(prompt).toMatch(/no explanation/i);
  });
});
