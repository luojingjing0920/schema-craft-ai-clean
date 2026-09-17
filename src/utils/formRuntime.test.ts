import { describe, it, expect } from "vitest";
import type { RJSFSchema } from "@rjsf/utils";
import { resolveFormLogic } from "./fieldReactions";
import {
  buildRuntimeSchema,
  buildSubmissionData,
  fieldSignature,
  withEffectiveRequired,
} from "./formRuntime";
import type { Field } from "../types/field";
import type { FieldReaction } from "../types/fieldReaction";

function field(overrides: Partial<Field> = {}): Field {
  return {
    id: "f1",
    dataType: "string",
    widget: "text",
    name: "field_one",
    title: "Field one",
    ...overrides,
  };
}

const AGE = field({ id: "age", dataType: "number", name: "age", title: "Age" });
const LICENCE = field({ id: "licence", name: "licence", title: "Licence" });
const PROVINCE = field({ id: "province", name: "province", title: "Province" });

const FIELDS = [AGE, LICENCE, PROVINCE];

/** The browser scenario: Licence is hidden while Age < 18. */
function hideWhileYoung(): FieldReaction {
  return {
    id: "r1",
    sourceFieldId: "age",
    targetFieldId: "licence",
    condition: { operator: "lessThan", value: 18 },
    effect: "hide",
  };
}

/** A hide rule that is *not* matched at Age 21, i.e. the field stays visible. */
function showWhileAdult(): FieldReaction {
  return { ...hideWhileYoung(), id: "r4", condition: { operator: "greaterThan", value: 18 }, effect: "show" };
}

/** Rules that DO match at Age 21. */
function requiredWhenAdult(effect: "required" | "optional"): FieldReaction {
  return {
    id: "r2",
    sourceFieldId: "age",
    targetFieldId: "licence",
    condition: { operator: "greaterThan", value: 18 },
    effect,
  };
}

function disabledWhenAdult(effect: "enable" | "disable"): FieldReaction {
  return { ...requiredWhenAdult(effect === "disable" ? "required" : "optional"), id: "r3", effect };
}

/** The schema the builder emits for these three fields. */
function baseSchema(required: string[] = []): RJSFSchema {
  const schema: RJSFSchema = {
    type: "object",
    properties: {
      age: { type: "number" },
      licence: { type: "string" },
      province: { type: "string" },
    },
  };
  if (required.length > 0) schema.required = required;
  return schema;
}

const statesFor = (reactions: FieldReaction[], formData: Record<string, unknown> = {}) =>
  resolveFormLogic(FIELDS, reactions, formData);

describe("fieldSignature", () => {
  const withProperties = (...names: string[]): RJSFSchema => ({
    type: "object",
    properties: Object.fromEntries(names.map((name) => [name, { type: "string" }])),
  });

  it("is unchanged when only the property order changes", () => {
    // Drag & drop reordering rewrites insertion order; it must not look like a different form.
    expect(fieldSignature(withProperties("b", "a", "c"))).toBe(
      fieldSignature(withProperties("a", "b", "c"))
    );
  });

  it("changes when a field is added", () => {
    expect(fieldSignature(withProperties("a", "b"))).not.toBe(
      fieldSignature(withProperties("a", "b", "c"))
    );
  });

  it("changes when a field is removed", () => {
    expect(fieldSignature(withProperties("a", "b"))).not.toBe(fieldSignature(withProperties("a")));
  });

  it("changes when a field is renamed", () => {
    expect(fieldSignature(withProperties("a", "b"))).not.toBe(
      fieldSignature(withProperties("a", "renamed"))
    );
  });

  it("treats a missing properties bag as no fields", () => {
    expect(fieldSignature({ type: "object" })).toBe("[]");
  });
});

describe("withEffectiveRequired", () => {
  it("writes the given names", () => {
    expect(withEffectiveRequired(baseSchema(), ["age"]).required).toEqual(["age"]);
  });

  it("removes the key entirely when nothing is required, matching the converter", () => {
    const next = withEffectiveRequired(baseSchema(["age"]), []);
    expect("required" in next).toBe(false);
  });

  it("leaves the rest of the schema alone", () => {
    const schema = baseSchema(["age"]);
    const next = withEffectiveRequired(schema, ["province"]);
    expect(next.properties).toEqual(schema.properties);
    expect(schema.required).toEqual(["age"]);
  });
});

describe("buildRuntimeSchema", () => {
  it("returns the same schema when there is no logic", () => {
    const schema = baseSchema();
    expect(buildRuntimeSchema(schema, FIELDS, null)).toBe(schema);
  });

  it("drops a hidden field's property so none of its constraints can apply", () => {
    // Age 16 < 18, hide rule matched -> Licence hidden.
    const states = statesFor([hideWhileYoung()], { age: 16 });
    const next = buildRuntimeSchema(baseSchema(), FIELDS, states);

    expect("licence" in (next.properties as Record<string, unknown>)).toBe(false);
    expect(Object.keys(next.properties as Record<string, unknown>).sort()).toEqual(["age", "province"]);
  });

  it("keeps the property when the rule does not match", () => {
    const states = statesFor([showWhileAdult()], { age: 21 });
    const next = buildRuntimeSchema(baseSchema(), FIELDS, states);
    expect("licence" in (next.properties as Record<string, unknown>)).toBe(true);
  });

  it("drops the hidden field from required as well", () => {
    // Both fields are required at rest, and the schema agrees — as the converter's output would.
    const requiredFields = [
      { ...AGE, required: true },
      { ...LICENCE, required: true },
    ];
    const states = resolveFormLogic(requiredFields, [hideWhileYoung()], { age: 16 });
    const next = buildRuntimeSchema(baseSchema(["age", "licence"]), requiredFields, states);
    expect(next.required).toEqual(["age"]);
  });

  it("promotes a field to required when the rule matches", () => {
    const states = statesFor([requiredWhenAdult("required")], { age: 21 });
    expect(buildRuntimeSchema(baseSchema(), FIELDS, states).required).toEqual(["licence"]);
  });

  it("demotes a field that is required at rest", () => {
    const requiredFields = [{ ...AGE, required: true }, { ...LICENCE, required: true }];
    const states = resolveFormLogic(requiredFields, [requiredWhenAdult("optional")], { age: 21 });
    const next = buildRuntimeSchema(baseSchema(["age", "licence"]), requiredFields, states);
    expect(next.required).toEqual(["age"]);
  });

  it("never mutates the schema it is given", () => {
    const schema = baseSchema(["licence"]);
    const snapshot = JSON.stringify(schema);
    buildRuntimeSchema(schema, FIELDS, statesFor([hideWhileYoung()], { age: 16 }));
    expect(JSON.stringify(schema)).toBe(snapshot);
  });
});

describe("buildSubmissionData", () => {
  it("copies everything when there is no logic", () => {
    const formData = { age: 21, licence: "B1234" };
    const payload = buildSubmissionData(FIELDS, null, formData);
    expect(payload).toEqual(formData);
    expect(payload).not.toBe(formData);
  });

  it("excludes hidden fields and keeps visible ones", () => {
    // Age 16 -> Licence hidden; Province has no rule, so it stays.
    const states = statesFor([hideWhileYoung()], { age: 16 });
    const payload = buildSubmissionData(FIELDS, states, {
      age: 16,
      licence: "B1234",
      province: "Guangdong",
    });

    expect(payload).toEqual({ age: 16, province: "Guangdong" });
  });

  it("keeps a disabled field's value", () => {
    // Disabling locks a value; it does not question it.
    const states = statesFor([disabledWhenAdult("disable")], { age: 21 });
    const payload = buildSubmissionData(FIELDS, states, { age: 21, licence: "B1234" });
    expect(payload).toEqual({ age: 21, licence: "B1234" });
  });

  it("keeps falsy values instead of dropping them", () => {
    const states = statesFor([], {});
    const payload = buildSubmissionData(FIELDS, states, { zero: 0, no: false, empty: "" });
    expect(payload).toEqual({ zero: 0, no: false, empty: "" });
  });

  it("does not mutate the form data it was given", () => {
    const states = statesFor([hideWhileYoung()], { age: 16 });
    const formData = { age: 16, licence: "B1234" };
    buildSubmissionData(FIELDS, states, formData);
    expect(formData).toEqual({ age: 16, licence: "B1234" });
  });

  it("drops a hidden field even when the rules produce no other effect", () => {
    const states = statesFor([hideWhileYoung()], { age: 16 });
    expect(buildSubmissionData(FIELDS, states, { licence: "x" })).toEqual({});
  });
});
