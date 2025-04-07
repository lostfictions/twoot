import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";

import retry from "async-retry";

import type { mastodon } from "masto";

import type { MastoAPIConfig, BskyAPIConfig } from "./index.js";
import type { BskyPostResult } from "./skeet.js";

/**
 * Kludge (or superstition) to try to avoid hitting API rate limits. Should be
 * made configurable -- or rate limiting should just be handled better.
 */
export const WAIT_TIME_BETWEEN_REPLIES = 50;

export function formatRejection(rej: PromiseRejectedResult): string {
  assert(Array.isArray(rej.reason));
  const [error, config] = rej.reason as [
    unknown,
    MastoAPIConfig | BskyAPIConfig,
  ];

  const message =
    error instanceof Error
      ? (error.stack ?? error.toString())
      : JSON.stringify(error);

  return `${config.type}${
    config.type === "mastodon" ? ` (${config.server})` : ""
  } error:\n\n${message}`;
}

export const formatMastoStatus = (s: mastodon.v1.Status) =>
  `${s.content || "<no text>"}\n${s.createdAt} => ${s.uri}`;

export const formatBskyStatus = (s: BskyPostResult) =>
  `${s.status || "<no text>"}\n => ${s.uri}`;

export async function doWithRetryAndTimeout<T extends () => Promise<any>>(
  fn: T,
  context: string,
): Promise<T extends () => Promise<infer U> ? U : never> {
  return retry(
    () =>
      Promise.race([
        fn(),
        // unsure if maxRetryTime option below times out the first call
        setTimeout(30_000).then(() => {
          throw new Error("Timeout exceeded!");
        }),
      ]),
    {
      retries: 5,
      maxTimeout: 10_000,
      maxRetryTime: 20_000,
      onRetry(e, attempt) {
        console.warn(
          `Error in retry block! (Attempt ${attempt})\n`,
          `Context: ${context}\n`,
          e,
        );
      },
    },
  );
}
