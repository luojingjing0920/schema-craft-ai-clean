import { parseAiFormDraft } from "./aiFormDraftSchema";
import type { FormDraftError, FormDraftResponse } from "../types/aiFormDraft";

/** The only endpoint the browser talks to. The provider is never called from here. */
export const FORM_DRAFT_ENDPOINT = "/api/ai/generate-form";

function failure(kind: FormDraftError["kind"], message: string, errors?: string[]): FormDraftResponse {
  return { ok: false, error: { kind, message, errors } };
}

/**
 * Asks the server for a draft, then checks it again here.
 *
 * The second check is not ceremony: the proxy could be misconfigured, swapped, or bypassed, so the
 * client treats the response as untrusted input like any other. It is also what turns `unknown`
 * into `AIFormDraft` without a cast.
 *
 * The endpoint is the only thing ever contacted — no provider hostname appears in browser code.
 */
export async function requestFormDraft(
  prompt: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch
): Promise<FormDraftResponse> {
  let response: Response;
  try {
    response = await fetchImpl(FORM_DRAFT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === "TimeoutError" || (error as Error)?.name === "AbortError") {
      return failure("timeout", "Generation took too long. Try again.");
    }
    return failure("network", "Could not reach the generator. Check your connection and try again.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return failure("provider", "The generator returned an unreadable response.");
  }

  const parsedBody = body as Partial<FormDraftResponse> | null;
  if (!response.ok || !parsedBody || parsedBody.ok !== true) {
    const error = (parsedBody as { error?: FormDraftError } | null)?.error;
    // A structured error from our own server is safe to show; anything else gets a generic message.
    if (error && typeof error.message === "string") return { ok: false, error };
    return failure("provider", "The generator is unavailable right now.");
  }

  const draft = parseAiFormDraft((body as { draft: unknown }).draft);
  if (!draft.ok) {
    return failure(
      "invalid-draft",
      "The generated form did not match the expected structure.",
      draft.errors.slice(0, 5)
    );
  }

  return { ok: true, draft: draft.draft };
}
