import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { randomUUID } from "node:crypto";

import { login, type mastodon } from "masto";

import { WAIT_TIME_BETWEEN_REPLIES, doWithRetryAndTimeout } from "./util.js";

import type { StatusOrText, Status, MastoAPIConfig } from "./index.js";

export async function postToot(
  status: StatusOrText,
  client: mastodon.Client,
  inReplyToId?: string,
): Promise<mastodon.v1.Status> {
  const s: Status = typeof status === "string" ? { status } : status;

  const mediaIds: string[] = [];

  if (s.media) {
    for (const m of s.media) {
      // form-data really doesn't like when fields are declared but undefined,
      // so we add them explicitly one-by-one.
      const config: Record<string, any> = {};
      if ("caption" in m) {
        config["caption"] = m.caption;
      }
      if ("focus" in m) {
        config["focus"] = m.focus;
      }

      const data = "buffer" in m ? m.buffer : await readFile(m.path);

      const file = new Blob([data]);

      const { id } = await doWithRetryAndTimeout(
        () =>
          client.v2.mediaAttachments.create({
            file,
            ...config,
          }),
        "Uploading media to Mastodon",
      );

      mediaIds.push(id);
    }
  }

  await Promise.race([
    Promise.all(mediaIds.map((id) => client.v2.mediaAttachments.waitFor(id))),
    setTimeout(300_000).then(() => {
      throw new Error(
        "Timeout exceeded while waiting for Mastodon uploaded media to process!",
      );
    }),
  ]);

  const idempotencyKey = randomUUID();

  const publishedToot = await doWithRetryAndTimeout(
    () =>
      client.v1.statuses.create(
        {
          status: s.status,
          visibility: s.visibility ?? "public",
          inReplyToId,
          mediaIds,
        },
        { idempotencyKey },
      ),
    "Posting to Mastodon",
  );

  return publishedToot;
}

export async function doToot(
  status: StatusOrText,
  apiConfig: MastoAPIConfig,
): Promise<mastodon.v1.Status> {
  const client = await doWithRetryAndTimeout(
    () =>
      login({
        url: apiConfig.server,
        accessToken: apiConfig.token,
        timeout: 30_000,
      }),
    "Logging in to Mastodon",
  );

  return postToot(status, client);
}

export async function doToots(
  statuses: StatusOrText[],
  apiConfig: MastoAPIConfig,
): Promise<mastodon.v1.Status[]> {
  const client = await doWithRetryAndTimeout(
    () =>
      login({
        url: apiConfig.server,
        accessToken: apiConfig.token,
        timeout: 30_000,
      }),
    "Logging in to Mastodon",
  );

  const postedStatuses: mastodon.v1.Status[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const inReplyToId = i > 0 ? postedStatuses[i - 1]!.id : undefined;

    postedStatuses.push(await postToot(statuses[i]!, client, inReplyToId));

    if (i < statuses.length - 1) {
      await setTimeout(WAIT_TIME_BETWEEN_REPLIES);
    }
  }

  return postedStatuses;
}
