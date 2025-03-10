import { readFile } from "fs/promises";
import { setTimeout } from "timers/promises";

import { AtpAgent, type AppBskyEmbedImages } from "@atproto/api";
import { type ReplyRef } from "@atproto/api/dist/client/types/app/bsky/feed/post.js";

import retry from "async-retry";

import { WAIT_TIME_BETWEEN_REPLIES } from "./util.js";

import type { StatusOrText, Status, BskyAPIConfig } from "./index.js";

type ImageEmbed = AppBskyEmbedImages.Image;
export type BskyRawPostResult = Awaited<
  ReturnType<typeof AtpAgent.prototype.post>
>;

export type BskyPostResult = {
  status: string;
  uri: string;
  rawResult: BskyRawPostResult;
};

async function login({ username, password }: BskyAPIConfig) {
  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.login({ identifier: username, password });
  return agent;
}

export async function postSkeet(
  status: StatusOrText,
  client: AtpAgent,
  apiConfig: BskyAPIConfig,
  inReplyToId?: ReplyRef,
): Promise<BskyPostResult> {
  const s: Status = typeof status === "string" ? { status } : status;

  const images: ImageEmbed[] = [];

  if (s.media) {
    for (const m of s.media) {
      const data = "buffer" in m ? m.buffer : await readFile(m.path);

      const file = new Blob([data]);

      const uploadRes = await client.uploadBlob(file);

      if (!uploadRes.success) {
        throw new Error(
          `Error uploading media to Bsky. Response headers:\n${JSON.stringify(uploadRes.headers, undefined, 2)}`,
        );
      }
      const img: ImageEmbed = {
        image: uploadRes.data.blob,
        alt: m.caption ?? "",
      };

      images.push(img);
    }
  }

  const postConfig: Parameters<typeof client.post>[0] = { text: s.status };
  if (images.length > 0) {
    // https://docs.bsky.app/docs/tutorials/creating-a-post#images-embeds
    postConfig.embed = { $type: "app.bsky.embed.images", images };
  }
  if (inReplyToId) {
    postConfig.reply = inReplyToId;
  }

  const publishedSkeet = await retry(() => client.post(postConfig), {
    retries: 5,
  });

  return {
    status: s.status,
    uri: `https://bsky.app/profile/${apiConfig.username}/post/${publishedSkeet.uri.split("/").at(-1)}`,
    rawResult: publishedSkeet,
  };
}

export async function doSkeet(
  status: StatusOrText,
  apiConfig: BskyAPIConfig,
): Promise<BskyPostResult> {
  const client = await retry(() => login(apiConfig));
  return postSkeet(status, client, apiConfig);
}

export async function doSkeets(
  statuses: StatusOrText[],
  apiConfig: BskyAPIConfig,
): Promise<BskyPostResult[]> {
  if (statuses.length === 0) return [];

  const client = await retry(() => login(apiConfig));
  // "Since threads of replies can get pretty long, reply posts need to
  // reference both the immediate parent post and the original root post of the
  // thread."
  // https://docs.bsky.app/docs/advanced-guides/posts#replies
  const firstPostedStatus = await postSkeet(statuses[0]!, client, apiConfig);
  const postedStatuses: BskyPostResult[] = [];
  postedStatuses.push(firstPostedStatus);
  for (let i = 1; i < statuses.length; i++) {
    const inReplyToId = postedStatuses[i - 1]!;
    postedStatuses.push(
      await postSkeet(statuses[i]!, client, apiConfig, {
        root: firstPostedStatus.rawResult,
        parent: inReplyToId.rawResult,
      }),
    );

    if (i < statuses.length - 1) {
      await setTimeout(WAIT_TIME_BETWEEN_REPLIES);
    }
  }

  return postedStatuses;
}
