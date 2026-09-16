import { describe, expect, it } from "vitest";
import { resolveCanvasFieldName } from "./canvasSelection";

const PREFIX = "root";

describe("resolveCanvasFieldName", () => {
    it("strips the id prefix built by the default rendering path", () => {
        expect(resolveCanvasFieldName("root_username", PREFIX, ["username"])).toBe("username");
    });

    it("accepts the bare name the grid path uses", () => {
        expect(resolveCanvasFieldName("username", PREFIX, ["username"])).toBe("username");
    });

    it("only strips the first segment of a name containing separators", () => {
        expect(resolveCanvasFieldName("root_my_field", PREFIX, ["my_field"])).toBe("my_field");
    });

    it("ignores ids that do not belong to a known field", () => {
        expect(resolveCanvasFieldName("root_unknown", PREFIX, ["username"])).toBeNull();
        expect(resolveCanvasFieldName("nested_deep_field", PREFIX, ["field"])).toBeNull();
        expect(resolveCanvasFieldName("", PREFIX, ["username"])).toBeNull();
    });

    it("never treats the root object itself as a field", () => {
        // "root" is not a field name, and it has no "root_" prefix to strip.
        expect(resolveCanvasFieldName("root", PREFIX, ["username"])).toBeNull();
    });

    it("matches field names containing spaces and punctuation", () => {
        expect(resolveCanvasFieldName("root_my field!", PREFIX, ["my field!"])).toBe("my field!");
    });

    it("returns null when there are no fields at all", () => {
        expect(resolveCanvasFieldName("root_username", PREFIX, [])).toBeNull();
    });
});
