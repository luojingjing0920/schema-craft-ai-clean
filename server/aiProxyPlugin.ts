import type { Connect, Plugin } from "vite";
import { loadEnv } from "vite";
import { createFormDraftHandler } from "./formDraftHandler";
import { createDeepSeekClient, MissingConfigError, readDeepSeekConfig, type DeepSeekClient } from "./deepseek";

/**
 * Mounts POST /api/ai/generate-form onto the Vite server.
 *
 * Bound to both the dev server and the preview server on purpose. A dev-only endpoint would work
 * perfectly while developing and 404 in a deployed build — the worst possible way to find out.
 * `vite preview` is not a production host, but it does exercise the built app against a real
 * endpoint, so the whole path gets checked locally.
 *
 * This is the only Vite-aware file; the handler it mounts has no idea Vite exists.
 */

const ROUTE = "/api/ai/generate-form";
const MAX_BODY_BYTES = 16 * 1024;

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function send(res: Parameters<Connect.NextHandleFunction>[1], status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

/**
 * Reads DEEPSEEK_* from the server environment without ever letting it reach the client bundle.
 *
 * `loadEnv` covers a local `.env`, and the real environment covers a deployed process; the latter
 * wins so a shell variable can override the file. Neither is ever exposed to the browser.
 */
function readConfigFromEnv(mode: string, root: string): DeepSeekClient | null {
  const fileEnv = loadEnv(mode, root, "");
  const merged: NodeJS.ProcessEnv = { ...fileEnv, ...process.env };

  try {
    return createDeepSeekClient(readDeepSeekConfig(merged));
  } catch (error) {
    // A missing key is not fatal to the server: the endpoint answers 503 until one is provided.
    if (error instanceof MissingConfigError) return null;
    throw error;
  }
}

export function aiProxyPlugin(): Plugin {
  // Filled in by configResolved, which Vite runs before either server starts.
  let client: DeepSeekClient | null = null;
  let handler: ReturnType<typeof createFormDraftHandler> | null = null;

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url?.split("?")[0] !== ROUTE) return next();

    if (req.method !== "POST") {
      send(res, 405, { ok: false, error: { kind: "prompt", message: "Use POST." } });
      return;
    }

    void (async () => {
      let body: unknown;
      try {
        body = await readJsonBody(req);
      } catch {
        send(res, 400, { ok: false, error: { kind: "prompt", message: "Malformed request." } });
        return;
      }

      if (!handler) {
        send(res, 503, {
          ok: false,
          error: { kind: "not-configured", message: "AI generation is not configured." },
        });
        return;
      }

      const result = await handler(body);
      send(res, result.status, result.body);
    })();
  };

  return {
    name: "schemacraft-ai-proxy",

    configResolved(config) {
      client = readConfigFromEnv(config.mode, config.root);

      handler = createFormDraftHandler({
        callLLM: (prompt, signal) => {
          if (!client) return Promise.reject(new MissingConfigError());
          return client.generateFormDraft(prompt, signal);
        },
        log: ({ status, ms, kind }) => {
          // Status and duration only: the prompt and the reply are the user's data.
          console.log(`[ai] ${status} ${ms}ms${kind ? ` (${kind})` : ""}`);
        },
      });
    },

    configureServer(server) {
      server.middlewares.use(middleware);
    },

    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
