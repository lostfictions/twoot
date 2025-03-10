import { vi, it, describe, expect } from "vitest";

import { twoot } from "./index.js";

let mastoMediaCreateCallCount = 0;
let mastoStatusCreateCallCount = 0;
vi.mock("masto", () => ({
  login: async ({ url }: { url: string }) => ({
    v2: {
      mediaAttachments: {
        create: async () => ({ id: `m${mastoMediaCreateCallCount++}` }),
        waitFor: () => Promise.resolve(),
      },
    },
    v1: {
      statuses: {
        create: async ({
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
          }${mediaIds && mediaIds.length > 0 ? `_withMedia[${mediaIds.join(",")}]` : ""}`;

          return {
            id,
            visibility,
            content: status,
            uri: `${url}/${id}`,
            createdAt: "<time>",
          };
        },
      },
    },
  }),
}));

let bskyMediaCreateCallCount = 0;
let bskyStatusCreateCallCount = 0;
vi.mock("@atproto/api", () => ({
  AtpAgent: class {
    readonly #service;
    constructor({ service }: { service: string }) {
      this.#service = service;
    }
    login() {}
    uploadBlob = async () => ({
      success: true,
      data: {
        blob: `m${bskyMediaCreateCallCount++}`,
      },
    });
    post = async ({
      reply: replyId,
      embed,
    }: {
      reply?: {
        root: { uri: string; cid: string };
        parent: { uri: string; cid: string };
      };
      embed?: { images: { image: string }[] };
    }) => {
      const id = `status_${bskyStatusCreateCallCount++}${
        replyId ? `_inReplyTo[${replyId.parent.uri}]` : ""
      }${embed ? `_withMedia[${embed.images.map((i) => i.image).join(",")}]` : ""}`;

      return {
        uri: `${this.#service}/status/${id}`,
        cid: id,
      };
    };
  },
}));

describe("api snapshots", () => {
  it("handles a simple status", async () => {
    const res = await twoot("hello world", [
      { type: "mastodon", server: "https://whatever.com", token: "xyz" },
      { type: "bsky", username: "user", password: "cool" },
    ]);

    expect(res).toHaveLength(2);
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
          media: [{ buffer: Buffer.from("abcdef"), caption: "abcdef" }],
        },
        {
          status: "one with a path",
          media: [{ path: "pingu.gif", caption: "pingu" }],
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
