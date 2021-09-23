import mockFs from "mock-fs";

import { twoot } from "./index";

let mediaCreateCallCount = 0;
let statusCreateCallCount = 0;
jest.mock("masto", () => ({
  login: jest.fn(async () => ({
    mediaAttachments: {
      create: jest.fn(async () => ({ id: `media${mediaCreateCallCount++}` })),
    },
    statuses: {
      create: jest.fn(async () => ({ id: `media${statusCreateCallCount++}` })),
    },
  })),
}));

beforeEach(() => {
  mockFs();
});

afterEach(() => {
  mockFs.restore();
});

describe("twoot", () => {
  it("exports correctly", () => {
    expect(typeof twoot).toBe("function");
  });
});
