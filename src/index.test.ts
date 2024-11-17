/* eslint-disable unicorn/consistent-function-scoping */
import { twoot } from "./index";

let mastoMediaCreateCallCount = 0;
let mastoStatusCreateCallCount = 0;
jest.mock("masto", () => ({
  login: jest.fn(async ({ url }: { url: string }) => ({
    v2: {
      mediaAttachments: {
        create: jest.fn(async () => ({
          id: `m${mastoMediaCreateCallCount++}`,
        })),
        waitFor: jest.fn(() => Promise.resolve()),
      },
    },
    v1: {
      statuses: {
        create: jest.fn(
          async ({
            status,
            visibility,
            inReplyToId,
            mediaIds,
          }: {
            status: string;
            visibility: string;
            inReplyToId: string;
            mediaIds?: string[];
          }) => {
            const id = `status_${mastoStatusCreateCallCount++}${
              inReplyToId ? `_inReplyTo[${inReplyToId}]` : ""
            }${mediaIds ? `_withMedia[${mediaIds.join(",")}]` : ""}`;

            return {
              id,
              visibility,
              content: status,
              uri: `${url}/${id}`,
              createdAt: "<time>",
            };
          },
        ),
      },
    },
  })),
}));

let bskyMediaCreateCallCount = 0;
let bskyStatusCreateCallCount = 0;
jest.mock("@atproto/api", () => ({
  AtpAgent: class {
    uploadBlob = jest.fn(async () => ({
      media_id_string: `m${bskyMediaCreateCallCount++}`,
    }));
    post = jest.fn(
      async ({
        text,
        reply: replyId,
        embed,
      }: {
        text: string;
        reply?: { uri: string; cid: string };
        embed?: { images: { alt: string }[] };
      }) => {
        const id = `status_${bskyStatusCreateCallCount++}${
          replyId ? `_inReplyTo[${replyId.uri}]` : ""
        }${embed ? `_withMedia[${embed.images.map((i) => i.alt).join(",")}]` : ""}`;

        return {
          id_str: id,
          text,
          created_at: "<time>",
          user: { screen_name: "username" },
        };
      },
    );
  },
}));

xdescribe("api snapshots", () => {
  it("handles a simple status", async () => {
    const res = await twoot("hello world", [
      { type: "mastodon", server: "https://whatever.com", token: "xyz" },
      { type: "bsky", username: "user", password: "cool" },
    ]);

    expect(res).toMatchSnapshot();
  });

  it("handles a chain of statuses", async () => {
    const res = await twoot(
      [
        { status: "a twoot", media: [] },
        "a reply",
        { status: "a third one" },
        {
          status: "one with a buffer",
          media: [{ buffer: Buffer.from("abcdef") }],
        },
        {
          status: "one with a path",
          media: [{ path: "pingu.gif" }],
        },
      ],
      [
        { type: "bsky", username: "user", password: "cool" },
        { type: "mastodon", server: "https://whatever.com", token: "xyz" },
      ],
    );

    expect(res).toMatchSnapshot();
  });
});
