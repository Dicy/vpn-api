import {Hono} from "hono";

const v1 = new Hono<AppEnv>();

v1.get("/test", async (c) => {
  return c.text("Hello world! This is a test");
});

export default v1;