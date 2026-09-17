import { parseAiFormDraft } from "../src/utils/aiFormDraftSchema";
import {
  AI_DRAFT_LIMITS,
  type FormDraftErrorKind,
  type FormDraftResponse,
} from "../src/types/aiFormDraft";
import {
  DeepSeekHttpError,
  DeepSeekResponseError,
  MissingConfigError,
} from "./deepseek";
import { buildSystemPrompt } from "./prompt";

/**
 * The whole AI endpoint, as a plain function.
 *
 * Nothing here knows about Vite, http or any framework: it takes a request body and returns a
 * status plus a JSON body. That is what makes it testable without a server, and what lets the same
 * code move to a serverless function later by writing an adapter instead of a rewrite.
 *
 * The response shape is shared with the browser (`src/types/aiFormDraft.ts`), so the two ends
 * cannot disagree about the wire.
 */

export interface FormDraftResult {
  status: number;
  body: FormDraftResponse;
}

/** The model call, injected so tests never touch the network. */
export type CallLLM = (prompt: string, signal?: AbortSignal) => Promise<string>;

export interface FormDraftHandlerDeps {
  callLLM: CallLLM;
  /** Logs status and duration only — never the prompt, the response body or the key. */
  log?: (entry: { status: number; ms: number; kind?: FormDraftErrorKind }) => void;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

/** The provider's own message is never forwarded — a failure body can echo the request. */
function mapProviderError(error: unknown): { status: number; kind: FormDraftErrorKind; message: string } {
  if (error instanceof MissingConfigError) {
    return {
      status: 503,
      kind: "not-configured",
      message: "AI generation is not configured.",
    };
  }

  if (error instanceof DeepSeekHttpError) {
    if (error.status === 401 || error.status === 403) {
      return { status: 502, kind: "auth", message: "AI generation is not configured correctly." };
    }
    if (error.status === 429) {
      return { status: 429, kind: "rate-limit", message: "Too many requests. Try again shortly." };
    }
    if (error.status >= 500) {
      return {
        status: 502,
        kind: "unavailable",
        message: "The generation service is unavailable right now.",
      };
    }
    return { status: 502, kind: "provider", message: "Generation failed. Try again." };
  }

  if (error instanceof DeepSeekResponseError) {
    return {
      status: 502,
      kind: "invalid-json",
      message: "The generator returned something unreadable.",
    };
  }

  if ((error as Error)?.name === "TimeoutError" || (error as Error)?.name === "AbortError") {
    return { status: 504, kind: "timeout", message: "Generation took too long." };
  }

  // Anything else is unexpected; it is logged by kind, never surfaced verbatim.
  return { status: 502, kind: "provider", message: "Generation failed. Please try again." };
}

export function createFormDraftHandler(deps: FormDraftHandlerDeps) {
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const log = deps.log ?? (() => {});

  return async function handleGenerateForm(body: unknown): Promise<FormDraftResult> {
    const startedAt = Date.now();
    const finish = (result: FormDraftResult): FormDraftResult => {
      log({
        status: result.status,
        ms: Date.now() - startedAt,
        kind: result.body.ok ? undefined : result.body.error.kind,
      });
      return result;
    };

    const prompt = (body as { prompt?: unknown } | null)?.prompt;
    if (typeof prompt !== "string" || prompt.trim() === "") {
      return finish({
        status: 400,
        body: { ok: false, error: { kind: "prompt", message: "Describe the form you need." } },
      });
    }

    // Re-checked here as well as in the page: the endpoint is reachable without going through it.
    if (prompt.length > AI_DRAFT_LIMITS.promptMaxLength) {
      return finish({
        status: 400,
        body: {
          ok: false,
          error: {
            kind: "prompt",
            message: `Keep the description under ${AI_DRAFT_LIMITS.promptMaxLength} characters.`,
          },
        },
      });
    }

    let reply: string;
    try {
      reply = await deps.callLLM(prompt, AbortSignal.timeout(timeoutMs));
    } catch (error) {
      const mapped = mapProviderError(error);
      return finish({
        status: mapped.status,
        body: { ok: false, error: { kind: mapped.kind, message: mapped.message } },
      });
    }

    // The client hands back raw text; parsing failures are an expected outcome, not an exception.
    let parsed: unknown;
    try {
      parsed = JSON.parse(reply);
    } catch {
      return finish({
        status: 502,
        body: {
          ok: false,
          error: { kind: "invalid-json", message: "The generator returned something unreadable." },
        },
      });
    }

    // Even when the provider enforced a schema, this is the boundary that decides what we accept.
    const result = parseAiFormDraft(parsed);
    if (!result.ok) {
      return finish({
        status: 502,
        body: {
          ok: false,
          error: {
            kind: "invalid-draft",
            message: "The generated form did not match the expected structure.",
            errors: result.errors.slice(0, 5),
          },
        },
      });
    }

    return finish({ status: 200, body: { ok: true, draft: result.draft } });
  };
}

export { buildSystemPrompt };
