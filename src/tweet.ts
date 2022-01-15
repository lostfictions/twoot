import { readFile } from "fs/promises";
import { setTimeout } from "timers/promises";

import {
  TwitterClient,
  StatusesUpdate as TwitterStatus,
} from "twitter-api-client";
import retry from "async-retry";

import { WAIT_TIME_BETWEEN_REPLIES } from "./util";

import type { StatusOrText, Status, TwitterAPIConfig } from "./index";

export async function postTweet(
  status: StatusOrText,
  client: TwitterClient,
  inReplyToId?: string
): Promise<TwitterStatus> {
  const s: Status = typeof status === "string" ? { status } : status;

  const mediaIds: string[] = [];

  if (s.media) {
    for (const m of s.media) {
      // the twitter client doesn't seem to let us stream the buffer directly
      const buffer = "buffer" in m ? m.buffer : await readFile(m.path);

      const { media_id_string } = await client.media.mediaUpload({
        media_data: buffer.toString("base64"),
      });

      mediaIds.push(media_id_string);

      if (m.caption) {
        await client.media.mediaMetadataCreate({
          media_id: media_id_string,
          alt_text: { text: m.caption },
        });
      }
    }
  }

  const publishedTweet = await retry(
    () =>
      client.tweets.statusesUpdate({
        status: s.status,
        in_reply_to_status_id: inReplyToId,
        auto_populate_reply_metadata: true,
        media_ids: mediaIds.length > 0 ? mediaIds.join(",") : undefined,
      }),
    { retries: 5 }
  );

  return publishedTweet;
}

export async function doTweet(
  status: StatusOrText,
  apiConfig: TwitterAPIConfig
): Promise<TwitterStatus> {
  const client = new TwitterClient({
    apiKey: apiConfig.apiKey,
    apiSecret: apiConfig.apiSecret,
    accessToken: apiConfig.accessToken,
    accessTokenSecret: apiConfig.accessSecret,
    disableCache: true,
  });

  return postTweet(status, client);
}

export async function doTweets(
  statuses: StatusOrText[],
  apiConfig: TwitterAPIConfig
): Promise<TwitterStatus[]> {
  const client = new TwitterClient({
    apiKey: apiConfig.apiKey,
    apiSecret: apiConfig.apiSecret,
    accessToken: apiConfig.accessToken,
    accessTokenSecret: apiConfig.accessSecret,
    disableCache: true,
  });

  const postedStatuses: TwitterStatus[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const inReplyToId = i > 0 ? postedStatuses[i - 1]!.id_str : undefined;

    postedStatuses.push(await postTweet(statuses[i]!, client, inReplyToId));

    if (i < statuses.length - 1) {
      await setTimeout(WAIT_TIME_BETWEEN_REPLIES);
    }
  }

  return postedStatuses;
}
