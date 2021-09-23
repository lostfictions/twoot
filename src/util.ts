import assert from "assert/strict";

import type { Status as MastoStatus } from "masto";
import type { StatusesUpdate as TwitterStatus } from "twitter-api-client";

import type { MastoAPIConfig, TwitterAPIConfig } from "./index";

export const WAIT_TIME_BETWEEN_REPLIES = 3000;

export function formatRejection(rej: PromiseRejectedResult): string {
  assert(Array.isArray(rej.reason));
  const [error, config] = rej.reason as [
    unknown,
    MastoAPIConfig | TwitterAPIConfig
  ];

  const message =
    error instanceof Error
      ? error.stack || error.toString()
      : JSON.stringify(error);

  return `${config.type}${
    config.type === "mastodon" ? ` (${config.server})` : ""
  } error:\n\n${message}`;
}

export const formatMastoStatus = (s: MastoStatus) =>
  `${s.text || "<no text>"}\n${s.createdAt} => ${s.uri}`;

export const formatTwitterStatus = (s: TwitterStatus) =>
  `${s.text || "<no text>"}\n${s.created_at} => https://twitter.com/${
    s.user.screen_name
  }/status/${s.id_str}`;
