import assert from "assert/strict";

import type { mastodon } from "masto";

import type { MastoAPIConfig, BskyAPIConfig } from "./index";
import type { BskyPostResult } from "./skeet";

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
  `${s.status || "<no text>"}\n${s.createdAt} => ${s.uri}`;
