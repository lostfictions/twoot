import { createReadStream } from "fs";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { setTimeout } from "timers/promises";
import { randomUUID } from "crypto";

import { login, MastoClient, Status as MastoStatus } from "masto";
import retry from "async-retry";

import { WAIT_TIME_BETWEEN_REPLIES } from "./util";

import type { StatusOrText, Status, MastoAPIConfig } from "./index";

export async function postToot(
  status: StatusOrText,
  client: MastoClient,
  inReplyToId?: string
): Promise<MastoStatus> {
  const s: Status = typeof status === "string" ? { status } : status;

  const mediaIds: string[] = [];

  if (s.media) {
    for (const m of s.media) {
      // form-data really doesn't like undefined fields, so add them explicitly
      // one-by-one.
      const config: Record<string, any> = {};
      if ("caption" in m) {
        config["caption"] = m.caption;
      }
      if ("focus" in m) {
        config["focus"] = m.focus;
      }

      if ("buffer" in m) {
        // kludge: buffer uploads don't seem to work, so write them to a temp
        // file first. see https://github.com/neet/masto.js/issues/481
        const path = join(tmpdir(), `masto-upload-${randomUUID()}.png`);
        await writeFile(path, m.buffer);

        const { id } = await client.mediaAttachments.create({
          file: createReadStream(path),
          ...config,
        });

        await unlink(path);

        mediaIds.push(id);
      } else {
        const { id } = await client.mediaAttachments.create({
          file: createReadStream(m.path),
          ...config,
        });

        mediaIds.push(id);
      }
    }
  }

  await Promise.all(mediaIds.map((id) => client.mediaAttachments.waitFor(id)));

  const idempotencyKey = randomUUID();

  const publishedToot = await retry(
    () =>
      client.statuses.create(
        {
          status: s.status,
          visibility: "public",
          inReplyToId,
          mediaIds,
        },
        idempotencyKey
      ),
    { retries: 5 }
  );

  return publishedToot;
}

export async function doToot(
  status: StatusOrText,
  apiConfig: MastoAPIConfig
): Promise<MastoStatus> {
  const client = await retry(() =>
    login({
      url: apiConfig.server,
      accessToken: apiConfig.token,
      timeout: 30000,
    })
  );

  return postToot(status, client);
}

export async function doToots(
  statuses: StatusOrText[],
  apiConfig: MastoAPIConfig
): Promise<MastoStatus[]> {
  const client = await retry(() =>
    login({
      url: apiConfig.server,
      accessToken: apiConfig.token,
      timeout: 30000,
    })
  );

  const postedStatuses: MastoStatus[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const inReplyToId = i > 0 ? postedStatuses[i - 1]!.id : undefined;

    postedStatuses.push(await postToot(statuses[i]!, client, inReplyToId));

    if (i < statuses.length - 1) {
      await setTimeout(WAIT_TIME_BETWEEN_REPLIES);
    }
  }

  return postedStatuses;
}
