import { describe, expect, it } from "vitest";
import worker from "./utils";

describe("Worker", () => {
  it("should return 404", async () => {
    const resp = await worker().fetch();
    if (resp) {
      const text = await resp.text();
      expect(text).toMatchInlineSnapshot('"404 Not Found"');
    }
  });
});