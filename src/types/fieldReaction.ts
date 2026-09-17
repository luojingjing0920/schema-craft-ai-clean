/**
 * Conditional logic between fields.
 *
 * A reaction belongs to the form, not to a field: rules reference fields by their stable `id`, so
 * renaming or reordering a field never invalidates one, and deleting a field can be cleaned up by
 * filtering both sides in a single pass.
 */

export type ReactionOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "isEmpty"
  | "isNotEmpty";

export type ReactionEffect =
  | "show"
  | "hide"
  | "enable"
  | "disable"
  | "required"
  | "optional";

/**
 * The leaf of a condition. Wrapped in an object so a future AND/OR group can widen this to
 * `{ all: ReactionCondition[] }` without reshaping the rule around it.
 */
export interface ReactionCondition {
  operator: ReactionOperator;
  /** Absent for isEmpty / isNotEmpty. Mirrors the three value axes of a form: string/number/boolean. */
  value?: string | number | boolean;
}

export interface FieldReaction {
  id: string;
  sourceFieldId: string;
  targetFieldId: string;
  condition: ReactionCondition;
  effect: ReactionEffect;
}

/**
 * Effects fall into three classes, and a target may hold at most one rule per class. Two rules of
 * the same class would be an invisible conflict resolved by array order, which a single-field
 * inspector cannot express, so the UI prevents it rather than the evaluator resolving it.
 */
export type ReactionEffectClass = "visibility" | "enabled" | "required";

export const EFFECT_CLASS: Record<ReactionEffect, ReactionEffectClass> = {
  show: "visibility",
  hide: "visibility",
  enable: "enabled",
  disable: "enabled",
  required: "required",
  optional: "required",
};

/** The effects a class can switch between, in the order the inspector offers them. */
export const CLASS_EFFECTS: Record<ReactionEffectClass, ReactionEffect[]> = {
  visibility: ["show", "hide"],
  enabled: ["enable", "disable"],
  required: ["required", "optional"],
};

/** User-facing wording. Written as "this field" because the target is always the inspected field. */
export const EFFECT_LABELS: Record<ReactionEffect, string> = {
  show: "Show this field",
  hide: "Hide this field",
  enable: "Enable this field",
  disable: "Disable this field",
  required: "Require this field",
  optional: "Make this field optional",
};

export const OPERATOR_LABELS: Record<ReactionOperator, string> = {
  equals: "equals",
  notEquals: "does not equal",
  greaterThan: "is greater than",
  lessThan: "is less than",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
};

/** Operators that carry no comparison value. */
export const VALUELESS_OPERATORS: ReactionOperator[] = ["isEmpty", "isNotEmpty"];

/** Everything the evaluator needs to know about one field on a given render. */
export interface EffectiveFieldState {
  visible: boolean;
  enabled: boolean;
  required: boolean;
}
