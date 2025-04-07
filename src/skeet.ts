import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

import sharp from "sharp";
import { AtpAgent, type AppBskyEmbedImages, RichText } from "@atproto/api";
import { type ReplyRef } from "@atproto/api/dist/client/types/app/bsky/feed/post.js";

import { doWithRetryAndTimeout, WAIT_TIME_BETWEEN_REPLIES } from "./util.js";

import type { StatusOrText, Status, BskyAPIConfig } from "./index.js";

// apparently you can get this with
// agent.app._client.lex.get("lex:app.bsky.embed.images").defs.image.properties.image.maxSize
// ...but that seems kind of flaky, so let's just hardcode it.
const MAX_IMAGE_SIZE = 1_000_000;

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

  // detect links and @mentions, since otherwise they'll simply be posted as
  // plaintext
  const rt = new RichText({ text: s.status });
  await rt.detectFacets(client);

  const images: ImageEmbed[] = [];

  if (s.media) {
    for (const m of s.media) {
      let data = "buffer" in m ? m.buffer : await readFile(m.path);

      // janky, but may improve failure rate for now
      // https://docs.bsky.app/docs/advanced-guides/posts#images-embeds
      let sh = sharp(data);
      const meta = await sh.metadata();
      // eslint-disable-next-line unicorn/explicit-length-check -- false pos, field might be undefined
      if (meta.size && meta.size > MAX_IMAGE_SIZE) {
        if (meta.width && meta.width > 2000) {
          sh = sh.resize(2000);
        }
        data = await sh.jpeg({ quality: 90 }).toBuffer();
      }

      // it can't figure out aspect ratio on its own, incredibly annoying
      const aspectRatio =
        meta.width && meta.height
          ? { width: meta.width, height: meta.height }
          : undefined;

      const file = new Blob([data]);

      const uploadRes = await doWithRetryAndTimeout(
        () => client.uploadBlob(file),
        "Uploading to Bsky",
      );

      if (!uploadRes.success) {
        throw new Error(
          `Error uploading media to Bsky. Response headers:\n${JSON.stringify(uploadRes.headers, undefined, 2)}`,
        );
      }
      const img: ImageEmbed = {
        image: uploadRes.data.blob,
        alt: m.caption ?? "",
        aspectRatio,
      };

      images.push(img);
    }
  }

  const postConfig: Parameters<typeof client.post>[0] = {
    $type: "app.bsky.feed.post",
    text: rt.text,
    facets: rt.facets,
  };
  if (images.length > 0) {
    // https://docs.bsky.app/docs/tutorials/creating-a-post#images-embeds
    postConfig.embed = { $type: "app.bsky.embed.images", images };
  }
  if (inReplyToId) {
    postConfig.reply = inReplyToId;
  }

  const publishedSkeet = await doWithRetryAndTimeout(
    () => client.post(postConfig),
    `Posting to Bsky`,
  );

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
  const client = await doWithRetryAndTimeout(
    () => login(apiConfig),
    "Logging in to Bsky",
  );
  return postSkeet(status, client, apiConfig);
}

export async function doSkeets(
  statuses: StatusOrText[],
  apiConfig: BskyAPIConfig,
): Promise<BskyPostResult[]> {
  if (statuses.length === 0) return [];

  const client = await doWithRetryAndTimeout(
    () => login(apiConfig),
    "Logging in to Bsky",
  );
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
