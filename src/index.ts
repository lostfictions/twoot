import { doToots, doToot } from "./toot";
import { doTweets, doTweet } from "./tweet";
import {
  formatRejection,
  formatMastoStatus,
  formatTwitterStatus,
} from "./util";

import type { StatusesUpdate as TwitterStatus } from "twitter-api-client";
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

export interface TwitterAPIConfig {
  type: "twitter";

  /**
   * The API Key is sometimes also referred to as the "consumer key."
   */
  apiKey: string;

  /**
   * The API Secret is sometimes also referred to as the "consumer secret."
   */
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export type APIConfig = MastoAPIConfig | TwitterAPIConfig;

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

export interface TwitterResult {
  type: "twitter";
  message: string;
  status: TwitterStatus;
}

export interface TwitterChainResult {
  type: "twitter-chain";
  message: string;
  statuses: TwitterStatus[];
}

export type Result =
  | FormattedError
  | MastodonResult
  | MastodonChainResult
  | TwitterResult
  | TwitterChainResult;

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
 * @param apiConfig The Twitter configuration.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfig: TwitterAPIConfig,
  globalConfig?: GlobalConfig,
): Promise<TwitterResult>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfig The Twitter configuration.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfig: TwitterAPIConfig,
  globalConfig?: GlobalConfig,
): Promise<TwitterChainResult>;

/**
 * @param status A single status.
 * @param apiConfigs The Mastodon and/or Twitter configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfigs: [TwitterAPIConfig, MastoAPIConfig],
  globalConfig?: GlobalConfig,
): Promise<[FormattedError | TwitterResult, FormattedError | MastodonResult]>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfigs The Mastodon and/or Twitter configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfigs: [TwitterAPIConfig, MastoAPIConfig],
  globalConfig?: GlobalConfig,
): Promise<
  [FormattedError | TwitterChainResult, FormattedError | MastodonChainResult]
>;

/**
 * @param status A single status.
 * @param apiConfigs The Mastodon and/or Twitter configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfigs: [MastoAPIConfig, TwitterAPIConfig],
  globalConfig?: GlobalConfig,
): Promise<[FormattedError | MastodonResult, FormattedError | TwitterResult]>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfigs The Mastodon and/or Twitter configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfigs: [MastoAPIConfig, TwitterAPIConfig],
  globalConfig?: GlobalConfig,
): Promise<
  [FormattedError | MastodonChainResult, FormattedError | TwitterChainResult]
>;

/**
 * @param status A single status.
 * @param apiConfigs The Mastodon and/or Twitter configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  status: StatusOrText,
  apiConfigs: APIConfig[],
  globalConfig?: GlobalConfig,
): Promise<(FormattedError | MastodonResult | TwitterResult)[]>;

/**
 * @param statuses An array of statuses which will be posted as a reply chain.
 * @param apiConfigs The Mastodon and/or Twitter configurations. Determines
 *                   which accounts will be posted to.
 * @param globalConfig Global configuration for the Twoot call.
 */
export async function twoot(
  statuses: StatusOrText[],
  apiConfigs: APIConfig[],
  globalConfig?: GlobalConfig,
): Promise<(FormattedError | MastodonChainResult | TwitterChainResult)[]>;

/**
 * @param statusOrStatuses A single status, or an array of statuses which will
 *                         be posted as a reply chain.
 * @param apiConfigOrConfigs The Mastodon and/or Twitter configuration(s).
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
          : doTweets(statusOrStatuses, config).catch((e) => {
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
      const ss = r.value as TwitterStatus[];
      return {
        type: "twitter-chain",
        message: ss.map(formatTwitterStatus).join("\n====\n"),
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
          : doTweet(statusOrStatuses, config).catch((e) => {
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
        type: "twitter",
        message: formatTwitterStatus(r.value),
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
