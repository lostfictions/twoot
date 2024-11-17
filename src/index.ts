import { doToots, doToot } from "./toot";
import { doSkeets, doSkeet, type BskyPostResult } from "./skeet";
import { formatRejection, formatMastoStatus, formatBskyStatus } from "./util";

import type { mastodon } from "masto";

export type StatusOrText = string | Status;

export interface Status {
  status: string;
  media?: Media[];
  /**
   * The visibility level the status should have when posted. Only applies to
   * Mastodon. Defaults to "public".
   */
  visibility?: mastodon.v1.Status["visibility"];
}

export type Media = (
  | {
      /** Path to the media attachment file. */
      path: string;
    }
  | {
      /** Image data buffer of the media attachment. */
      buffer: Buffer;
    }
) & {
  /** The image caption or description, for accessibility. */
  caption?: string;

  /**
   * Two floating points (x,y), comma-delimited, ranging from -1.0 to 1.0.
   *
   * See [Mastodon API
   * documentation](https://docs.joinmastodon.org/methods/statuses/media/#focal-points).
   */
  focus?: string;
};

export interface MastoAPIConfig {
  type: "mastodon";

  /**
   * The URL of the Mastodon server. For example, `https://botsin.space`.
   */
  server: string;
  token: string;
}

export interface BskyAPIConfig {
  type: "bsky";

  username: string;
  password: string;
}

export type APIConfig = MastoAPIConfig | BskyAPIConfig;

export interface GlobalConfig {
  /**
   * Should the entire promise reject if any one crosspost rejects? Twoot will
   * always reject if _all_ post attempts in a call fail, but by default the
   * promise will fulfill with a partial success if _some but not all_
   * crossposts succeed.
   */
  rejectOnAnyFailure?: boolean;
}

export interface FormattedError {
  type: "error";
  message: string;
}

export interface MastodonResult {
  type: "mastodon";
  message: string;
  status: mastodon.v1.Status;
}

export interface MastodonChainResult {
  type: "mastodon-chain";
  message: string;
  statuses: mastodon.v1.Status[];
}

export interface BskyResult {
  type: "bsky";
  message: string;
  status: BskyPostResult;
}

export interface BskyChainResult {
  type: "bsky-chain";
  message: string;
  statuses: BskyPostResult[];
}

export type Result =
  | FormattedError
  | MastodonResult
  | MastodonChainResult
  | BskyResult
  | BskyChainResult;

/**
 * @param status A single status.
 * @param apiConfig The Mastodon configuration.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfig: MastoAPIConfig,
  globalConfig?: GlobalConfig,
): Promise<MastodonResult>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfig The Mastodon configuration.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfig: MastoAPIConfig,
  globalConfig?: GlobalConfig,
): Promise<MastodonChainResult>;

/**
 * @param status A single status.
 * @param apiConfig The Bsky configuration.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfig: BskyAPIConfig,
  globalConfig?: GlobalConfig,
): Promise<BskyResult>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfig The Bsky configuration.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfig: BskyAPIConfig,
  globalConfig?: GlobalConfig,
): Promise<BskyChainResult>;

/**
 * @param status A single status.
 * @param apiConfigs The Mastodon and/or Bsky configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfigs: [BskyAPIConfig, MastoAPIConfig],
  globalConfig?: GlobalConfig,
): Promise<[FormattedError | BskyResult, FormattedError | MastodonResult]>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfigs The Mastodon and/or Bsky configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfigs: [BskyAPIConfig, MastoAPIConfig],
  globalConfig?: GlobalConfig,
): Promise<
  [FormattedError | BskyChainResult, FormattedError | MastodonChainResult]
>;

/**
 * @param status A single status.
 * @param apiConfigs The Mastodon and/or Bsky configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfigs: [MastoAPIConfig, BskyAPIConfig],
  globalConfig?: GlobalConfig,
): Promise<[FormattedError | MastodonResult, FormattedError | BskyResult]>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfigs The Mastodon and/or Bsky configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfigs: [MastoAPIConfig, BskyAPIConfig],
  globalConfig?: GlobalConfig,
): Promise<
  [FormattedError | MastodonChainResult, FormattedError | BskyChainResult]
>;

/**
 * @param status A single status.
 * @param apiConfigs The Mastodon and/or Bsky configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfigs: APIConfig[],
  globalConfig?: GlobalConfig,
): Promise<(FormattedError | MastodonResult | BskyResult)[]>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfigs The Mastodon and/or Bsky configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfigs: APIConfig[],
  globalConfig?: GlobalConfig,
): Promise<(FormattedError | MastodonChainResult | BskyChainResult)[]>;

/**
 * @param statusOrStatuses A single status, or an array of statuses which will
 *                         be posted as a reply chain.
 * @param apiConfigOrConfigs The Mastodon and/or Bsky configuration(s).
 *                           Determines which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 * @returns
 */
export async function twoot(
  statusOrStatuses: StatusOrText | StatusOrText[],
  apiConfigOrConfigs: APIConfig | APIConfig[],
  globalConfig: GlobalConfig = {},
): Promise<Result | Result[]> {
  const [isSingleAPIConfig, apiConfigs] = Array.isArray(apiConfigOrConfigs)
    ? [false, apiConfigOrConfigs]
    : [true, [apiConfigOrConfigs]];

  let results: Result[];
  if (Array.isArray(statusOrStatuses)) {
    /* eslint-disable @typescript-eslint/no-throw-literal */
    const settledResults = await Promise.allSettled(
      apiConfigs.map((config) =>
        config.type === "mastodon"
          ? doToots(statusOrStatuses, config).catch((e) => {
              throw [e, config];
            })
          : doSkeets(statusOrStatuses, config).catch((e) => {
              throw [e, config];
            }),
      ),
    );
    /* eslint-enable @typescript-eslint/no-throw-literal */

    results = settledResults.map((r) => {
      if (r.status === "rejected") {
        return { type: "error", message: formatRejection(r) };
      }
      if ("visibility" in r.value[0]!) {
        const ss = r.value as mastodon.v1.Status[];
        return {
          type: "mastodon-chain",
          message: ss.map(formatMastoStatus).join("\n====\n"),
          statuses: ss,
        };
      }
      const ss = r.value as BskyPostResult[];
      return {
        type: "bsky-chain",
        message: ss.map(formatBskyStatus).join("\n====\n"),
        statuses: ss,
      };
    });
  } else {
    /* eslint-disable @typescript-eslint/no-throw-literal */
    const settledResults = await Promise.allSettled(
      apiConfigs.map((config) =>
        config.type === "mastodon"
          ? doToot(statusOrStatuses, config).catch((e) => {
              throw [e, config];
            })
          : doSkeet(statusOrStatuses, config).catch((e) => {
              throw [e, config];
            }),
      ),
    );
    /* eslint-enable @typescript-eslint/no-throw-literal */

    results = settledResults.map((r) => {
      if (r.status === "rejected") {
        return { type: "error", message: formatRejection(r) };
      }
      if ("visibility" in r.value) {
        return {
          type: "mastodon",
          message: formatMastoStatus(r.value),
          status: r.value,
        };
      }
      return {
        type: "bsky",
        message: formatBskyStatus(r.value),
        status: r.value,
      };
    });
  }

  const rejections = results.filter((r) => r.type === "error");

  if (
    rejections.length === results.length ||
    (rejections.length > 0 && globalConfig.rejectOnAnyFailure)
  ) {
    throw new Error(
      `Failed to twoot:\n${JSON.stringify(results, undefined, 2)}`,
    );
  }

  return isSingleAPIConfig ? results[0]! : results;
}
