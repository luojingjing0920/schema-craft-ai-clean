import { describe, it, expect } from "vitest";
import { FORM_DRAFT_ENDPOINT, requestFormDraft } from "./formDraftClient";

/** A fetch stand-in; no test here touches the network. */
function fakeFetch(response: Partial<Response> & { jsonBody?: unknown }): typeof fetch {
  return (async () => ({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => {
      if (response.jsonBody === undefined) throw new Error("not json");
      return response.jsonBody;
    },
  })) as unknown as typeof fetch;
}

const validDraft = {
  name: "Job application",
  fields: [{ key: "text", title: "Name" }],
};

describe("requestFormDraft", () => {
  it("posts to our own endpoint and nothing else", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string) => {
      calls.push(url);
      return { ok: true, status: 200, json: async () => ({ ok: true, draft: validDraft }) };
    }) as unknown as typeof fetch;

    await requestFormDraft("a form", undefined, fetchImpl);

    expect(calls).toEqual([FORM_DRAFT_ENDPOINT]);
  });

  it("returns the draft when the server answers with a valid one", async () => {
    const result = await requestFormDraft(
      "x",
      undefined,
      fakeFetch({ jsonBody: { ok: true, draft: validDraft } })
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.draft.fields).toHaveLength(1);
  });

  it("re-validates on the client rather than trusting the response", async () => {
    const result = await requestFormDraft(
      "x",
      undefined,
      fakeFetch({ jsonBody: { ok: true, draft: { name: "x", fields: [{ key: "nope", title: "T" }] } } })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-draft");
      expect(result.error.errors?.[0]).toContain("key");
    }
  });

  it("surfaces a structured error from our own server", async () => {
    const result = await requestFormDraft(
      "x",
      undefined,
      fakeFetch({
        ok: false,
        status: 429,
        jsonBody: { ok: false, error: { kind: "rate-limit", message: "Too many requests." } },
      })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("rate-limit");
  });

  it("reports a network failure without leaking the underlying error", async () => {
    const fetchImpl = (async () => {
      throw new Error("getaddrinfo ENOTFOUND api.internal");
    }) as unknown as typeof fetch;

    const result = await requestFormDraft("x", undefined, fetchImpl);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("network");
      expect(result.error.message).not.toContain("api.internal");
    }
  });

  it("reports a timeout as a timeout", async () => {
    const fetchImpl = (async () => {
      const error = new Error("aborted");
      error.name = "TimeoutError";
      throw error;
    }) as unknown as typeof fetch;

    const result = await requestFormDraft("x", undefined, fetchImpl);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("timeout");
  });

  it("handles a response that is not JSON at all", async () => {
    const result = await requestFormDraft("x", undefined, fakeFetch({ ok: false, status: 502 }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("provider");
  });

  it("caps reported schema errors at five", async () => {
    const fields = Array.from({ length: 9 }, () => ({ key: "nope", title: "T" }));
    const result = await requestFormDraft(
      "x",
      undefined,
      fakeFetch({ jsonBody: { ok: true, draft: { name: "x", fields } } })
    );

    if (!result.ok) expect(result.error.errors).toHaveLength(5);
    else throw new Error("expected a failure");
  });
});
