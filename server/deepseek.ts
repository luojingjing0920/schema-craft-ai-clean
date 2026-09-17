import { AI_FORM_DRAFT_SCHEMA } from "../src/utils/aiFormDraftSchema";

/**
 * DeepSeek, and nothing else.
 *
 * Not an interface with a provider registry: there is one thing to abstract — "send a prompt, get
 * structured JSON back" — and a function is the smallest honest version of it. Adding a second
 * provider means editing this file, which beats maintaining an abstraction for a case that does not
 * exist yet.
 *
 * Uses the Responses API (`POST /responses`), which takes `text.format` as a JSON Schema so the
 * model is constrained at generation time rather than merely asked nicely. That constraint is a
 * convenience, never a guarantee: the handler still validates the result with AJV.
 *
 * Reference: https://api-docs.deepseek.com/api/create-response/
 */

export interface DeepSeekConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  maxOutputTokens: number;
}

export class MissingConfigError extends Error {
  constructor() {
    super("DEEPSEEK_API_KEY is not configured on the server");
    this.name = "MissingConfigError";
  }
}

/** The provider answered, but not with a success. Carries only the status. */
export class DeepSeekHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`deepseek responded ${status}`);
    this.name = "DeepSeekHttpError";
    this.status = status;
  }
}

/** The provider answered 200 with something we cannot use. */
export class DeepSeekResponseError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "DeepSeekResponseError";
  }
}

const DEFAULT_BASE_URL = "https://api.deepseek.com";
/**
 * The model the app ships with. DeepSeek's docs list `deepseek-v4-flash` / `deepseek-v4-pro`; set
 * DEEPSEEK_MODEL if the account is provisioned with a different name.
 */
const DEFAULT_MODEL = "deepseek-flash";
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;

export function readDeepSeekConfig(env: NodeJS.ProcessEnv = process.env): DeepSeekConfig {
  const apiKey = env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new MissingConfigError();

  return {
    apiKey,
    model: env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL,
    baseUrl: (env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, ""),
    maxOutputTokens:
      Number(env.DEEPSEEK_MAX_OUTPUT_TOKENS) > 0
        ? Number(env.DEEPSEEK_MAX_OUTPUT_TOKENS)
        : DEFAULT_MAX_OUTPUT_TOKENS,
  };
}

interface ResponsesPayload {
  status?: string;
  error?: { code?: string; message?: string } | null;
  incomplete_details?: { reason?: string } | null;
  output?: {
    type?: string;
    role?: string;
    content?: { type?: string; text?: string }[];
  }[];
}

/**
 * Reads the assistant text out of a Responses payload.
 *
 * The shape is `output[] -> message item -> content[] -> output_text parts`, which is the API's own
 * layout — the SDK's `output_text` convenience field is an aggregate the SDK builds, not a field on
 * the wire, so it is assembled here rather than assumed to exist.
 */
export function extractOutputText(payload: unknown): string | null {
  const response = payload as ResponsesPayload | null;
  if (!response || !Array.isArray(response.output)) return null;

  const text = response.output
    .filter((item) => item?.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part?.type === "output_text")
    .map((part) => part.text ?? "")
    .join("");

  return text.trim() === "" ? null : text;
}

export interface DeepSeekClient {
  /**
   * Returns the model's text. It is deliberately unparsed: deciding whether the reply is usable is
   * the handler's job, so a malformed answer is a handled outcome rather than an exception here.
   */
  generateFormDraft(prompt: string, signal?: AbortSignal): Promise<string>;
}

export function createDeepSeekClient(
  config: DeepSeekConfig,
  fetchImpl: typeof fetch = fetch
): DeepSeekClient {
  return {
    async generateFormDraft(prompt, signal) {
      const response = await fetchImpl(`${config.baseUrl}/responses`, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          // `input` is the Responses equivalent of a user message.
          input: prompt,
          max_output_tokens: config.maxOutputTokens,
          // The contract, enforced during generation.
          text: {
            format: {
              type: "json_schema",
              name: "schema_craft_form_draft",
              schema: AI_FORM_DRAFT_SCHEMA,
            },
          },
        }),
      });

      if (!response.ok) {
        // The status only: a provider error body can echo the request, prompt included.
        throw new DeepSeekHttpError(response.status);
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new DeepSeekResponseError("response body was not JSON");
      }

      const body = payload as ResponsesPayload;
      if (body?.error) throw new DeepSeekResponseError("the model reported an error");
      if (body?.status === "incomplete") {
        // Usually max_output_tokens: a truncated draft is not a draft.
        throw new DeepSeekResponseError("the response was truncated");
      }

      const text = extractOutputText(payload);
      if (text === null) throw new DeepSeekResponseError("no output text in the response");

      return text;
    },
  };
}
