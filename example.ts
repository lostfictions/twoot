import { parseEnv, z } from "znv";
import { config } from "dotenv";

import { twoot } from "./src";

config();

/* eslint-disable node/no-process-env */
const { MASTODON_SERVER, MASTODON_TOKEN } = parseEnv(process.env, {
  MASTODON_SERVER: z.string().min(1),
  MASTODON_TOKEN: z.string().min(1),
});
/* eslint-enable node/no-process-env */

void (async () => {
  const res = await twoot(
    { status: "testing a twoot", media: [{ path: "pingu.gif" }] },
    { type: "mastodon", server: MASTODON_SERVER, token: MASTODON_TOKEN }
  );

  console.log(`twooted!\n\n${JSON.stringify(res, undefined, 2)}`);
})();
