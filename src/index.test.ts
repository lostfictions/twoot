import mockFs from "mock-fs";

import { twoot } from "./index";

let mastoMediaCreateCallCount = 0;
let mastoStatusCreateCallCount = 0;
jest.mock("masto", () => ({
  login: jest.fn(async ({ url }: { url: string }) => ({
    mediaAttachments: {
      create: jest.fn(async () => ({ id: `m${mastoMediaCreateCallCount++}` })),
    },
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
        }
      ),
    },
  })),
}));

let twitterMediaCreateCallCount = 0;
let twitterStatusCreateCallCount = 0;
jest.mock("twitter-api-client", () => ({
  TwitterClient: class {
    media = {
      mediaUpload: jest.fn(async () => ({
        media_id_string: `m${twitterMediaCreateCallCount++}`,
      })),
      mediaMetadataCreate: jest.fn(),
    };
    tweets = {
      statusesUpdate: jest.fn(
        async ({
          status,
          in_reply_to_status_id: replyId,
          media_ids,
        }: {
          status: string;
          in_reply_to_status_id?: string;
          media_ids?: string;
        }) => {
          const id = `status_${twitterStatusCreateCallCount++}${
            replyId ? `_inReplyTo[${replyId}]` : ""
          }${media_ids ? `_withMedia[${media_ids}]` : ""}`;

          return {
            id_str: id,
            text: status,
            created_at: "<time>",
            user: { screen_name: "username" },
          };
        }
      ),
    };
  },
}));

beforeEach(() => {
  mockFs();
});

afterEach(() => {
  mockFs.restore();
});

describe("api snapshots", () => {
  it("handles a simple status", async () => {
    const res = await twoot("hello world", [
      { type: "mastodon", server: "https://whatever.com", token: "xyz" },
      {
        type: "twitter",
        apiKey: "abc",
        apiSecret: "def",
        accessToken: "ghi",
        accessSecret: "jkl",
      },
    ]);

    mockFs.restore();
    expect(res).toMatchSnapshot();
  });

  it("handles a chain of statuses", async () => {
    const res = await twoot(
      [
        { status: "a twoot", media: [] },
        "a reply",
        { status: "a third one" },
        // mock-fs seems to be buggy, so we can't test media uploads as long as
        // masto... also buggily requires that we write to the filesystem :(
        // https://github.com/neet/masto.js/issues/481
        // https://github.com/tschaub/mock-fs/issues/338
        // { status: "another one", media: [{ buffer: Buffer.from("abcdef") }] },
      ],
      [
        {
          type: "twitter",
          apiKey: "abc",
          apiSecret: "def",
          accessToken: "ghi",
          accessSecret: "jkl",
        },
        { type: "mastodon", server: "https://whatever.com", token: "xyz" },
      ]
    );

    mockFs.restore();
    expect(res).toMatchSnapshot();
  });
});
