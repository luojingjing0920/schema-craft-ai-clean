import { describe, expect, it } from "vitest";
import { resolveCanvasField, type CanvasFieldRef } from "./canvasSelection";

const PREFIX = "root";

function refs(...names: string[]): CanvasFieldRef[] {
    return names.map((name) => ({ id: `id-${name}`, name }));
}

describe("resolveCanvasField", () => {
    it("strips the id prefix built by the default rendering path", () => {
        expect(resolveCanvasField("root_username", PREFIX, refs("username"))).toEqual({
            id: "id-username",
            name: "username",
        });
    });

    it("accepts the bare name the grid path uses", () => {
        expect(resolveCanvasField("username", PREFIX, refs("username"))?.id).toBe("id-username");
    });

    it("only strips the first segment of a name containing separators", () => {
        expect(resolveCanvasField("root_my_field", PREFIX, refs("my_field"))?.name).toBe("my_field");
    });

    it("ignores ids that do not belong to a known field", () => {
        expect(resolveCanvasField("root_unknown", PREFIX, refs("username"))).toBeNull();
        expect(resolveCanvasField("nested_deep_field", PREFIX, refs("field"))).toBeNull();
        expect(resolveCanvasField("", PREFIX, refs("username"))).toBeNull();
    });

    it("never treats the root object itself as a field", () => {
        // "root" is not a field name, and it has no "root_" prefix to strip.
        expect(resolveCanvasField("root", PREFIX, refs("username"))).toBeNull();
    });

    it("matches field names containing spaces and punctuation", () => {
        expect(resolveCanvasField("root_my field!", PREFIX, refs("my field!"))?.name).toBe("my field!");
    });

    it("returns null when there are no fields at all", () => {
        expect(resolveCanvasField("root_username", PREFIX, [])).toBeNull();
    });
});
