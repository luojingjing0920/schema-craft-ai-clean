import { describe, it, expect } from "vitest";
import { createFormStorage, FORMS_STORAGE_KEY, type StorageLike } from "./formStorage";
import type { Field } from "../types/field";
import type { FormDefinition } from "../types/formDefinition";

/** Map-backed stand-in for Web Storage: runs in the node environment, no jsdom needed. */
function fakeStorage(seed?: string) {
  const map = new Map<string, string>();
  if (seed !== undefined) map.set(FORMS_STORAGE_KEY, seed);

  const storage: StorageLike = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
  return { storage, map, raw: () => map.get(FORMS_STORAGE_KEY) };
}

const LAYOUT: FormDefinition["layout"] = {
  labelPosition: "top",
  columns: 1,
  spacing: "normal",
  showSubmitButton: true,
  submitButtonText: "Submit",
};

function makeField(overrides: Partial<Field> = {}): Field {
  return {
    id: "field-1",
    dataType: "string",
    widget: "text",
    name: "string_abc",
    title: "String field",
    ...overrides,
  };
}

function makeForm(id: string, overrides: Partial<FormDefinition> = {}): FormDefinition {
  return {
    id,
    name: `Form ${id}`,
    description: "",
    fields: [],
    layout: { ...LAYOUT },
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("formStorage", () => {
  it("1. lists nothing when the store was never written", () => {
    const { storage } = fakeStorage();
    expect(createFormStorage(storage).listForms()).toEqual([]);
  });

  it("2. saves a form and reads it back", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);
    const form = makeForm("a");

    expect(store.saveForm(form)).toBe(true);
    expect(store.getForm("a")).toEqual(form);
  });

  it("3. returns null for an id that was never stored", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);
    store.saveForm(makeForm("a"));
    expect(store.getForm("missing")).toBeNull();
  });

  it("4. overwrites the same id instead of duplicating it", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);

    store.saveForm(makeForm("a", { name: "First" }));
    store.saveForm(makeForm("a", { name: "Second" }));

    expect(store.listForms()).toHaveLength(1);
    expect(store.getForm("a")?.name).toBe("Second");
  });

  it("5. keeps several forms side by side", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);

    store.saveForm(makeForm("a"));
    store.saveForm(makeForm("b"));
    store.saveForm(makeForm("c"));

    expect(store.listForms().map((form) => form.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("6. lists most recently updated first", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);

    store.saveForm(makeForm("old", { updatedAt: "2026-09-01T00:00:00.000Z" }));
    store.saveForm(makeForm("newest", { updatedAt: "2026-09-03T00:00:00.000Z" }));
    store.saveForm(makeForm("middle", { updatedAt: "2026-09-02T00:00:00.000Z" }));

    expect(store.listForms().map((form) => form.id)).toEqual(["newest", "middle", "old"]);
  });

  it("7. deletes a stored form", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);
    store.saveForm(makeForm("a"));

    expect(store.deleteForm("a")).toBe(true);
    expect(store.getForm("a")).toBeNull();
    expect(store.listForms()).toEqual([]);
  });

  it("8. reports false when deleting an id that is not stored", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);
    expect(store.deleteForm("ghost")).toBe(false);
  });

  it("9. uses the versioned storage key", () => {
    const { storage, map } = fakeStorage();
    createFormStorage(storage).saveForm(makeForm("a"));
    expect([...map.keys()]).toEqual(["schemacraft.forms.v1"]);
  });

  it("10. treats malformed JSON as an unreadable store", () => {
    const { storage } = fakeStorage("{not json");
    const store = createFormStorage(storage);

    expect(store.listForms()).toEqual([]);
    expect(store.getForm("a")).toBeNull();
  });

  it("11. refuses to save over malformed JSON and leaves the raw value untouched", () => {
    const { storage, raw } = fakeStorage("{not json");
    const store = createFormStorage(storage);

    expect(store.saveForm(makeForm("a"))).toBe(false);
    expect(raw()).toBe("{not json");
  });

  it("12. rejects a payload whose forms field is not an array", () => {
    const { storage, raw } = fakeStorage(JSON.stringify({ forms: "nope" }));
    const store = createFormStorage(storage);

    expect(store.listForms()).toEqual([]);
    expect(store.saveForm(makeForm("a"))).toBe(false);
    expect(raw()).toBe(JSON.stringify({ forms: "nope" }));
  });

  it("13. keeps valid records and drops invalid ones", () => {
    const good = makeForm("good");
    const { storage } = fakeStorage(
      JSON.stringify({
        forms: [
          good,
          { id: "", name: "no id", fields: [], layout: {}, createdAt: "x", updatedAt: "x" },
          { id: "no-fields", name: "x", layout: {}, createdAt: "x", updatedAt: "x" },
          null,
          "a string",
        ],
      })
    );
    const store = createFormStorage(storage);

    expect(store.listForms()).toEqual([good]);
    expect(store.getForm("no-fields")).toBeNull();
  });

  it("14. degrades to empty and refuses to save when getItem throws", () => {
    const storage: StorageLike = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {},
    };
    const store = createFormStorage(storage);

    expect(store.listForms()).toEqual([]);
    expect(store.getForm("a")).toBeNull();
    expect(store.saveForm(makeForm("a"))).toBe(false);
    expect(store.deleteForm("a")).toBe(false);
  });

  it("15. reports false when setItem throws", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage({
      getItem: storage.getItem,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    });

    expect(store.saveForm(makeForm("a"))).toBe(false);
  });

  it("16. round-trips omitted optional fields as absent", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);
    store.saveForm(makeForm("a", { fields: [makeField()] }));

    const field = store.getForm("a")?.fields[0];
    expect(field).toBeDefined();
    expect("placeholder" in field!).toBe(false);
    expect("description" in field!).toBe(false);
    expect(field!.width).toBeUndefined();
  });

  it("17. round-trips an inherited (undefined) width as still undefined", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);
    store.saveForm(makeForm("a", { fields: [makeField({ width: undefined })] }));

    expect(store.getForm("a")?.fields[0].width).toBeUndefined();
  });

  it("18. round-trips an explicit width override", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);
    store.saveForm(makeForm("a", { fields: [makeField({ width: 100 })] }));

    expect(store.getForm("a")?.fields[0].width).toBe(100);
  });

  it("round-trips the whole FormDefinition without loss", () => {
    const { storage } = fakeStorage();
    const store = createFormStorage(storage);
    const form = makeForm("a", {
      name: "Job Application",
      description: "Apply here",
      fields: [makeField({ required: true, options: ["x", "y"], rows: 3, disabled: true })],
      layout: { ...LAYOUT, columns: 2 },
    });

    store.saveForm(form);
    expect(store.getForm("a")).toEqual(form);
  });
});
