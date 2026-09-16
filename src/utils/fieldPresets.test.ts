import { describe, expect, it } from "vitest";
import { FIELD_PRESETS, findPreset, presetOf } from "./fieldPresets";

describe("FIELD_PRESETS", () => {
    it("holds nine presets with unique keys", () => {
        expect(FIELD_PRESETS).toHaveLength(9);

        const keys = FIELD_PRESETS.map((preset) => preset.key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("resolves every preset by its own key", () => {
        for (const preset of FIELD_PRESETS) {
            expect(findPreset(preset.key)).toBe(preset);
        }
        expect(findPreset("does-not-exist")).toBeUndefined();
    });
});

describe("presetOf", () => {
    it("separates the three string + text kinds", () => {
        expect(presetOf({ dataType: "string", widget: "text" }).key).toBe("text");
        expect(presetOf({ dataType: "string", widget: "text", format: "email" }).key).toBe("email");
        expect(presetOf({ dataType: "string", widget: "text", format: "date" }).key).toBe("date");
    });

    it("identifies password and radio", () => {
        expect(presetOf({ dataType: "string", widget: "password" }).key).toBe("password");
        expect(presetOf({ dataType: "string", widget: "radio" }).key).toBe("radio");
    });

    it("keeps the original five kinds recognisable", () => {
        expect(presetOf({ dataType: "string", widget: "textarea" }).key).toBe("textarea");
        expect(presetOf({ dataType: "string", widget: "select" }).key).toBe("select");
        expect(presetOf({ dataType: "number", widget: "text" }).key).toBe("number");
        expect(presetOf({ dataType: "boolean", widget: "checkbox" }).key).toBe("boolean");
    });

    it("falls back to the data type for a boolean rendered as radios", () => {
        // There is no boolean-radio preset, so this must not be mistaken for the radio kind.
        expect(presetOf({ dataType: "boolean", widget: "radio" }).key).toBe("boolean");
    });
});
