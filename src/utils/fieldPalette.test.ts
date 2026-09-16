import { describe, it, expect } from "vitest";
import { FIELD_PALETTE_GROUPS, FIELD_PRESET_ICONS } from "./fieldPalette";
import { FIELD_PRESETS } from "./fieldPresets";

describe("fieldPalette", () => {
  const groupedKeys = FIELD_PALETTE_GROUPS.flatMap((group) => group.keys);

  it("groups every preset exactly once", () => {
    // Guards the palette against a new preset being added without a group, and against a preset
    // being listed in two groups at once.
    expect([...groupedKeys].sort()).toEqual(FIELD_PRESETS.map((preset) => preset.key).sort());
  });

  it("uses only keys that exist as presets", () => {
    const knownKeys = new Set(FIELD_PRESETS.map((preset) => preset.key));
    for (const key of groupedKeys) {
      expect(knownKeys.has(key)).toBe(true);
    }
  });

  it("gives every group a label and at least one key", () => {
    for (const group of FIELD_PALETTE_GROUPS) {
      expect(group.label).not.toBe("");
      expect(group.keys.length).toBeGreaterThan(0);
    }
  });

  it("has an icon for every preset", () => {
    for (const preset of FIELD_PRESETS) {
      expect(FIELD_PRESET_ICONS[preset.key]).toBeTruthy();
    }
  });
});
