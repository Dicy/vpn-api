import { unstable_dev, UnstableDevWorker } from "wrangler";
import { beforeAll, afterAll } from "vitest";

let worker: UnstableDevWorker | null = null;

beforeAll(async () => {
  worker = await unstable_dev("src/index.ts", {
    experimental: { disableExperimentalWarning: true }
  });
});

afterAll(async () => {
  await worker?.stop();
});

export default () => worker as UnstableDevWorker;