# twoot

toot and/or ~~tweet~~ skeet. a common (and lowest-common-denominator) api for simplifying cross-posting to mastodon and ~~twitter~~ bsky.

> :warning: note that this library is primarily intended for my own personal hobbyist use with [my bots](https://github.com/lostfictions?tab=repositories&q=botally). i can only provide limited support for other use cases on a best-effort basis.

![noot and/or twoot](pingu.gif)

## install

```sh
npm install twoot
# OR
yarn add twoot
# OR
pnpm i twoot
```

## usage

```ts
import { twoot } from "twoot";

void (async () => {
  const results = await twoot(
    {
      status: "testing a twoot",

      // upload a file from disk with with the `path` param, or pass an image
      // buffer directly with the `buffer` param.
      media: [{ path: "pingu.gif" }],

      // some properties unique to a single service, like per-post visibility
      // for mastodon, are supported.
      visibility: "unlisted",
    },

    // pass a single service configuration object, or pass an array of them to
    // post to multiple services at once.
    [
      {
        type: "mastodon",
        server: process.env.MASTODON_SERVER,
        token: process.env.MASTODON_TOKEN,
      },
      {
        type: "bsky",
        username: process.env.BSKY_USERNAME,
        password: process.env.BSKY_PASSWORD,
      },
    ],
  );

  await twoot(
    // if you pass in an array of statuses, they'll be posted as a thread.
    [{ status: "one" }, { status: "two" }, { status: "three" }],
    {
      type: "mastodon",
      server: process.env.MASTODON_SERVER,
      token: process.env.MASTODON_TOKEN,
    },
    // by default `twoot` will throw if posting to *all* services fails, but you
    // can configure it to throw if posting to *any* service fails.
    { rejectOnAnyFailure: true },
  );

  // the return value is an array of results of attempting to post to each
  // provided service. they're returned in the same order you passed them
  // in.
  for (const res of results) {
    if (res.type === "error") {
      // if `rejectOnAnyFailure` isn't set to `true`, the return value may
      // contain failures. you're responsible for checking for them and
      // deciding how to handle them.
      console.error(`error while twooting:\n${res.message}\n`);
    } else if (res.type === "bsky") {
      console.log(`skeeted at '${res.status.uri}'!`);
    } else {
      console.log(`tooted at '${res.status.url}'!`);
    }
  }
})();
```

###### [more bots?](https://github.com/lostfictions?tab=repositories&q=botally)
