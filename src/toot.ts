import { readFile } from "fs/promises";
import { setTimeout } from "timers/promises";
import { randomUUID } from "crypto";

import { login, type mastodon } from "masto";
import retry from "async-retry";

import { WAIT_TIME_BETWEEN_REPLIES } from "./util.js";

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

      const { id } = await client.v2.mediaAttachments.create({
        file,
        ...config,
      });

      mediaIds.push(id);
    }
  }

  await Promise.all(
    mediaIds.map((id) => client.v2.mediaAttachments.waitFor(id)),
  );

  const idempotencyKey = randomUUID();

  const publishedToot = await retry(
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
    { retries: 5 },
  );

  return publishedToot;
}

export async function doToot(
  status: StatusOrText,
  apiConfig: MastoAPIConfig,
): Promise<mastodon.v1.Status> {
  const client = await retry(() =>
    login({
      url: apiConfig.server,
      accessToken: apiConfig.token,
      timeout: 30000,
    }),
  );

  return postToot(status, client);
}

export async function doToots(
  statuses: StatusOrText[],
  apiConfig: MastoAPIConfig,
): Promise<mastodon.v1.Status[]> {
  const client = await retry(() =>
    login({
      url: apiConfig.server,
      accessToken: apiConfig.token,
      timeout: 30000,
    }),
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
