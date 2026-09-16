import { describe, expect, it } from "vitest";
import type { Field } from "../types/field";
import { resolveFieldWidths } from "./formLayout";

function field(name: string, width?: number): Field {
    return {
        id: `id-${name}`,
        dataType: "string",
        widget: "text",
        name,
        title: name,
        ...(width === undefined ? {} : { width }),
    };
}

describe("resolveFieldWidths", () => {
    it("keeps the single-column default when columns is 1", () => {
        const [resolved] = resolveFieldWidths([field("a")], 1);

        expect(resolved.width).toBe(100);
    });

    it("inherits half the row at columns = 2", () => {
        const [resolved] = resolveFieldWidths([field("a")], 2);

        expect(resolved.width).toBe(50);
    });

    it("inherits a third of the row at columns = 3", () => {
        const [resolved] = resolveFieldWidths([field("a")], 3);

        expect(resolved.width).toBe(33);
    });

    it("inherits a quarter of the row at columns = 4", () => {
        const [resolved] = resolveFieldWidths([field("a")], 4);

        expect(resolved.width).toBe(25);
    });

    it("keeps an explicit non-round width override", () => {
        const resolved = resolveFieldWidths([field("a", 75)], 2);

        expect(resolved[0].width).toBe(75);
    });

    it("keeps an explicit 100 so the field still claims a whole row", () => {
        const resolved = resolveFieldWidths([field("a", 100)], 2);

        expect(resolved[0].width).toBe(100);
    });

    it("mixes inherited and overridden widths", () => {
        const resolved = resolveFieldWidths([field("a"), field("b"), field("c", 100)], 2);

        expect(resolved.map((f) => f.width)).toEqual([50, 50, 100]);
    });

    it("does not mutate the input array or its fields", () => {
        const fields = [field("a"), field("b", 75)];
        const snapshot = fields.map((f) => ({ ...f }));

        const resolved = resolveFieldWidths(fields, 3);

        expect(resolved).not.toBe(fields);
        expect(fields).toEqual(snapshot);
        expect(fields[0].width).toBeUndefined();
        expect(fields[1].width).toBe(75);
    });

    it("leaves a field without a width untouched when it already has one", () => {
        const explicit = field("a", 75);
        const resolved = resolveFieldWidths([explicit], 4);

        // Nothing to inherit, so the very same object can be reused.
        expect(resolved[0]).toBe(explicit);
    });
});
