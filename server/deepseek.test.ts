import { describe, it, expect } from "vitest";
import {
  createDeepSeekClient,
  DeepSeekHttpError,
  DeepSeekResponseError,
  extractOutputText,
  MissingConfigError,
  readDeepSeekConfig,
  type DeepSeekConfig,
} from "./deepseek";
import { AI_FORM_DRAFT_SCHEMA } from "../src/utils/aiFormDraftSchema";

/** No test here touches the network. */
const CONFIG: DeepSeekConfig = {
  apiKey: "test-key",
  model: "deepseek-flash",
  baseUrl: "https://api.deepseek.com",
  maxOutputTokens: 1024,
};

/** A response in the shape the Responses API documents. */
const responsesPayload = (text: string) => ({
  id: "resp_1",
  object: "response",
  status: "completed",
  output: [
    { id: "rs_1", type: "reasoning", content: [{ type: "reasoning_text", text: "thinking…" }] },
    { id: "msg_1", type: "message", role: "assistant", content: [{ type: "output_text", text }] },
  ],
});

function fakeFetch(payload: unknown, ok = true, status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return {
      ok,
      status,
      json: async () => {
        if (payload === undefined) throw new Error("not json");
        return payload;
      },
    };
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe("readDeepSeekConfig", () => {
  it("requires a key", () => {
    expect(() => readDeepSeekConfig({})).toThrow(MissingConfigError);
  });

  it("defaults the model and base url", () => {
    const config = readDeepSeekConfig({ DEEPSEEK_API_KEY: "k" });
    expect(config.model).toBe("deepseek-flash");
    expect(config.baseUrl).toBe("https://api.deepseek.com");
  });

  it("reads overrides and trims a trailing slash", () => {
    const config = readDeepSeekConfig({
      DEEPSEEK_API_KEY: "k",
      DEEPSEEK_MODEL: "deepseek-v4-flash",
      DEEPSEEK_BASE_URL: "https://proxy.internal/v1/",
      DEEPSEEK_MAX_OUTPUT_TOKENS: "4096",
    });

    expect(config.model).toBe("deepseek-v4-flash");
    expect(config.baseUrl).toBe("https://proxy.internal/v1");
    expect(config.maxOutputTokens).toBe(4096);
  });
});

describe("extractOutputText", () => {
  it("reads the assistant message and ignores reasoning items", () => {
    expect(extractOutputText(responsesPayload('{"a":1}'))).toBe('{"a":1}');
  });

  it("joins several output_text parts", () => {
    const payload = {
      output: [
        {
          type: "message",
          role: "assistant",
          content: [
            { type: "output_text", text: '{"a":' },
            { type: "output_text", text: "1}" },
          ],
        },
      ],
    };
    expect(extractOutputText(payload)).toBe('{"a":1}');
  });

  it("finds nothing when there is no message or no text", () => {
    expect(extractOutputText({ output: [{ type: "reasoning", content: [] }] })).toBeNull();
    expect(extractOutputText({ output: [] })).toBeNull();
    expect(extractOutputText({ output: [{ type: "message", content: [] }] })).toBeNull();
    expect(extractOutputText({})).toBeNull();
    expect(extractOutputText(null)).toBeNull();
    expect(extractOutputText("a string")).toBeNull();
  });
});

describe("createDeepSeekClient", () => {
  it("posts to /responses with the contract as text.format", async () => {
    const { impl, calls } = fakeFetch(responsesPayload('{"ok":true}'));
    await createDeepSeekClient(CONFIG, impl).generateFormDraft("a job application");

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.deepseek.com/responses");

    const body = JSON.parse(calls[0].init.body as string);
    expect(body.model).toBe("deepseek-flash");
    expect(body.input).toBe("a job application");
    expect(body.max_output_tokens).toBe(1024);
    expect(body.text.format.type).toBe("json_schema");
    expect(body.text.format.name).toBe("schema_craft_form_draft");
    expect(body.text.format.schema).toEqual(AI_FORM_DRAFT_SCHEMA);
  });

  it("sends the key as a bearer header, never in the url or body", async () => {
    const { impl, calls } = fakeFetch(responsesPayload("{}"));
    await createDeepSeekClient(CONFIG, impl).generateFormDraft("x");

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer test-key");
    expect(calls[0].url).not.toContain("test-key");
    expect(String(calls[0].init.body)).not.toContain("test-key");
  });

  it("returns the model's text", async () => {
    const { impl } = fakeFetch(responsesPayload('{"name":"x"}'));
    const text = await createDeepSeekClient(CONFIG, impl).generateFormDraft("x");
    expect(text).toBe('{"name":"x"}');
  });

  it("throws with the status for a non-ok response", async () => {
    for (const status of [400, 401, 403, 429, 500, 503]) {
      const { impl } = fakeFetch(undefined, false, status);
      await expect(createDeepSeekClient(CONFIG, impl).generateFormDraft("x")).rejects.toMatchObject({
        name: "DeepSeekHttpError",
        status,
      });
    }
  });

  it("does not read the body of a failed response", async () => {
    // A failure body can echo the prompt, so the client must not parse or forward it.
    const { impl } = fakeFetch({ error: { message: "prompt was: my secret" } }, false, 500);
    const error = await createDeepSeekClient(CONFIG, impl)
      .generateFormDraft("my secret")
      .then(
        () => null,
        (thrown: unknown) => thrown as Error
      );

    expect(error).toBeInstanceOf(DeepSeekHttpError);
    expect(JSON.stringify({ m: error?.message, n: error?.name })).not.toContain("my secret");
  });

  it("rejects a body that is not JSON", async () => {
    const { impl } = fakeFetch(undefined, true, 200);
    await expect(createDeepSeekClient(CONFIG, impl).generateFormDraft("x")).rejects.toBeInstanceOf(
      DeepSeekResponseError
    );
  });

  it("rejects a payload carrying an error", async () => {
    const { impl } = fakeFetch({ error: { code: "server_error", message: "boom" } });
    await expect(createDeepSeekClient(CONFIG, impl).generateFormDraft("x")).rejects.toBeInstanceOf(
      DeepSeekResponseError
    );
  });

  it("rejects a truncated response", async () => {
    const payload = { status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [] };
    const { impl } = fakeFetch(payload);
    await expect(createDeepSeekClient(CONFIG, impl).generateFormDraft("x")).rejects.toBeInstanceOf(
      DeepSeekResponseError
    );
  });

  it("rejects a completed response with no text at all", async () => {
    const { impl } = fakeFetch({ status: "completed", output: [] });
    await expect(createDeepSeekClient(CONFIG, impl).generateFormDraft("x")).rejects.toBeInstanceOf(
      DeepSeekResponseError
    );
  });
});
