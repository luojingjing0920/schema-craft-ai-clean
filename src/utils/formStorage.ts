import type { FormDefinition } from "../types/formDefinition";

/** Versioned key: a future shape change gets its own key instead of misreading this one. */
export const FORMS_STORAGE_KEY = "schemacraft.forms.v1";

/** The slice of the Web Storage API this repository uses, so tests can pass a plain fake. */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export interface FormStorage {
  /** Newest edit first. */
  listForms(): FormDefinition[];
  getForm(id: string): FormDefinition | null;
  /** False when nothing was written — see the write-safety rules below. */
  saveForm(form: FormDefinition): boolean;
  deleteForm(id: string): boolean;
}

/**
 * An empty store (nothing written yet) is a *successful* read that happens to hold no forms, which
 * is a different thing from a read that failed. Keeping the two apart is what stops a corrupted
 * store from being silently overwritten by the next save.
 */
type ReadResult = { ok: true; forms: FormDefinition[] } | { ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Deliberately shallow: enough to keep a malformed record out of the builder, no schema library. */
function isFormDefinition(value: unknown): value is FormDefinition {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    typeof value.name === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.fields) &&
    isRecord(value.layout)
  );
}

/** ISO timestamps sort correctly as plain strings. */
function byUpdatedAtDesc(a: FormDefinition, b: FormDefinition): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function createFormStorage(storage: StorageLike): FormStorage {
  function read(): ReadResult {
    let raw: string | null;
    try {
      raw = storage.getItem(FORMS_STORAGE_KEY);
    } catch {
      // Storage blocked (private mode, disabled by policy): read as nothing, never as empty.
      return { ok: false };
    }

    if (raw === null) return { ok: true, forms: [] };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false };
    }

    if (!isRecord(parsed) || !Array.isArray(parsed.forms)) return { ok: false };

    // A single bad record is dropped; the rest of the store stays readable.
    return { ok: true, forms: parsed.forms.filter(isFormDefinition) };
  }

  function write(forms: FormDefinition[]): boolean {
    try {
      storage.setItem(FORMS_STORAGE_KEY, JSON.stringify({ forms }));
      return true;
    } catch {
      return false;
    }
  }

  return {
    listForms() {
      const result = read();
      return result.ok ? [...result.forms].sort(byUpdatedAtDesc) : [];
    },

    getForm(id) {
      const result = read();
      if (!result.ok) return null;
      return result.forms.find((form) => form.id === id) ?? null;
    },

    /**
     * Stores the builder's own FormDefinition — `formDefinition.fields`, never the
     * `resolveFieldWidths(...)` output. Resolved fields carry the width a field *inherits* from the
     * form's column layout; persisting those would turn "Auto" into an explicit override and freeze
     * the field at whatever column count happened to be set when it was saved.
     */
    saveForm(form) {
      const result = read();
      // Unreadable store: refuse rather than overwrite data we cannot account for.
      if (!result.ok) return false;

      const others = result.forms.filter((existing) => existing.id !== form.id);
      return write([...others, form]);
    },

    deleteForm(id) {
      const result = read();
      if (!result.ok) return false;
      if (!result.forms.some((form) => form.id === id)) return false;
      return write(result.forms.filter((form) => form.id !== id));
    },
  };
}

let defaultStorage: FormStorage | null = null;

/**
 * `window.localStorage` is touched only when a method runs, never at module load, so importing this
 * file is safe where the DOM is absent (node, tests). Any access error surfaces inside the
 * read/write try blocks above and degrades to "unavailable" rather than throwing.
 */
function getDefaultStorage(): FormStorage {
  defaultStorage ??= createFormStorage({
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  });
  return defaultStorage;
}

export const formStorage: FormStorage = {
  listForms: () => getDefaultStorage().listForms(),
  getForm: (id) => getDefaultStorage().getForm(id),
  saveForm: (form) => getDefaultStorage().saveForm(form),
  deleteForm: (id) => getDefaultStorage().deleteForm(id),
};
