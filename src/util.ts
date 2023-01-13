import assert from "assert/strict";

import type { mastodon } from "masto";
import type { StatusesUpdate as TwitterStatus } from "twitter-api-client";

import type { MastoAPIConfig, TwitterAPIConfig } from "./index";

/**
 * Kludge (or superstition) to try to avoid hitting API rate limits. Should be
 * made configurable -- or rate limiting should just be handled better.
 */
export const WAIT_TIME_BETWEEN_REPLIES = 50;

export function formatRejection(rej: PromiseRejectedResult): string {
  assert(Array.isArray(rej.reason));
  const [error, config] = rej.reason as [
    unknown,
    MastoAPIConfig | TwitterAPIConfig
  ];

  const message =
    error instanceof Error
      ? error.stack ?? error.toString()
      : JSON.stringify(error);

  return `${config.type}${
    config.type === "mastodon" ? ` (${config.server})` : ""
  } error:\n\n${message}`;
}

export const formatMastoStatus = (s: mastodon.v1.Status) =>
  `${s.content || "<no text>"}\n${s.createdAt} => ${s.uri}`;

export const formatTwitterStatus = (s: TwitterStatus) =>
  `${s.text || "<no text>"}\n${s.created_at} => https://twitter.com/${
    s.user.screen_name
  }/status/${s.id_str}`;
