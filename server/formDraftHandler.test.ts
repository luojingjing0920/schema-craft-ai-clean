import { describe, it, expect } from "vitest";
import { createFormDraftHandler, type CallLLM } from "./formDraftHandler";
import { DeepSeekHttpError, DeepSeekResponseError, MissingConfigError } from "./deepseek";
import { AI_DRAFT_LIMITS } from "../src/types/aiFormDraft";

/** No test in this file touches the network: the model call is injected. */
const handlerWith = (callLLM: CallLLM) => createFormDraftHandler({ callLLM, log: () => {} });

const VALID_REPLY = JSON.stringify({
  name: "Job application",
  fields: [
    { key: "text", title: "Name", required: true },
    { key: "email", title: "Email" },
  ],
});

const answer = (content: string): CallLLM => async () => content;
const fail = (error: unknown): CallLLM => async () => {
  throw error;
};

describe("createFormDraftHandler", () => {
  it("returns the draft for a well-formed reply", async () => {
    const result = await handlerWith(answer(VALID_REPLY))({ prompt: "a job application form" });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    if (result.body.ok) expect(result.body.draft.fields).toHaveLength(2);
  });

  it("accepts a reply with leading or trailing whitespace", async () => {
    const result = await handlerWith(answer(`  ${VALID_REPLY}  `))({ prompt: "x" });
    expect(result.status).toBe(200);
  });

  it("rejects a reply that is not JSON", async () => {
    const result = await handlerWith(answer("Sure! Here is your form:"))({ prompt: "x" });

    expect(result.status).toBe(502);
    expect(result.body.ok).toBe(false);
    if (!result.body.ok) expect(result.body.error.kind).toBe("invalid-json");
  });

  it("rejects JSON that does not match the contract, and reports what was wrong", async () => {
    const result = await handlerWith(
      answer(JSON.stringify({ name: "x", fields: [{ key: "signature", title: "Sign" }] }))
    )({ prompt: "x" });

    expect(result.status).toBe(502);
    if (!result.body.ok) {
      expect(result.body.error.kind).toBe("invalid-draft");
      expect(result.body.error.errors?.[0]).toContain("fields[0].key");
    }
  });

  it("caps the reported schema errors at five", async () => {
    const fields = Array.from({ length: 8 }, () => ({ key: "nope", title: "T" }));
    const result = await handlerWith(answer(JSON.stringify({ name: "x", fields })))({ prompt: "x" });

    if (!result.body.ok) {
      expect(result.body.error.errors).toHaveLength(5);
      expect(result.body.error.errors?.length).toBeLessThanOrEqual(5);
    } else {
      throw new Error("expected a failure");
    }
  });

  it("maps a rate limit to 429", async () => {
    const result = await handlerWith(fail(new DeepSeekHttpError(429)))({ prompt: "x" });

    expect(result.status).toBe(429);
    if (!result.body.ok) expect(result.body.error.kind).toBe("rate-limit");
  });

  it("maps an auth failure without leaking provider text", async () => {
    for (const status of [401, 403]) {
      const result = await handlerWith(fail(new DeepSeekHttpError(status)))({ prompt: "x" });
      expect(result.status).toBe(502);
      if (!result.body.ok) expect(result.body.error.kind).toBe("auth");
    }
  });

  it("maps a provider 5xx to unavailable", async () => {
    const result = await handlerWith(fail(new DeepSeekHttpError(503)))({ prompt: "x" });

    expect(result.status).toBe(502);
    if (!result.body.ok) expect(result.body.error.kind).toBe("unavailable");
  });

  it("maps an unusable provider response", async () => {
    const result = await handlerWith(fail(new DeepSeekResponseError("truncated")))({ prompt: "x" });

    expect(result.status).toBe(502);
    if (!result.body.ok) expect(result.body.error.kind).toBe("invalid-json");
  });

  it("maps an unexpected failure without leaking its message", async () => {
    const result = await handlerWith(fail(new Error("sk-secret leaked in message")))({ prompt: "x" });

    expect(result.status).toBe(502);
    if (!result.body.ok) {
      expect(result.body.error.kind).toBe("provider");
      expect(JSON.stringify(result.body)).not.toContain("sk-secret");
    }
  });

  it("maps a timeout to 504", async () => {
    const timeout = new Error("timed out");
    timeout.name = "TimeoutError";
    const result = await handlerWith(fail(timeout))({ prompt: "x" });

    expect(result.status).toBe(504);
    if (!result.body.ok) expect(result.body.error.kind).toBe("timeout");
  });

  it("reports a missing key as not configured", async () => {
    const result = await handlerWith(fail(new MissingConfigError()))({ prompt: "x" });

    expect(result.status).toBe(503);
    if (!result.body.ok) expect(result.body.error.kind).toBe("not-configured");
  });

  it("rejects an empty prompt", async () => {
    for (const prompt of ["", "   ", undefined, 42]) {
      const result = await handlerWith(answer(VALID_REPLY))({ prompt });
      expect(result.status).toBe(400);
      if (!result.body.ok) expect(result.body.error.kind).toBe("prompt");
    }
  });

  it("rejects a prompt that is too long", async () => {
    const result = await handlerWith(answer(VALID_REPLY))({
      prompt: "x".repeat(AI_DRAFT_LIMITS.promptMaxLength + 1),
    });

    expect(result.status).toBe(400);
    if (!result.body.ok) expect(result.body.error.kind).toBe("prompt");
  });

  it("strips whitespace-only replies down to invalid-json", async () => {
    const result = await handlerWith(answer("   "))({ prompt: "x" });
    expect(result.status).toBe(502);
    if (!result.body.ok) expect(result.body.error.kind).toBe("invalid-json");
  });

  it("logs status and duration only", async () => {
    const entries: unknown[] = [];
    const handler = createFormDraftHandler({
      callLLM: answer(VALID_REPLY),
      log: (entry) => entries.push(entry),
    });

    await handler({ prompt: "my private request text" });

    expect(entries).toHaveLength(1);
    expect(Object.keys(entries[0] as object).sort()).toEqual(["kind", "ms", "status"]);
    expect(JSON.stringify(entries)).not.toContain("private request");
  });
});
