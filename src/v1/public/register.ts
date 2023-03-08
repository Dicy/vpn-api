import {Hono} from "hono";

const register = new Hono<AppEnv>();
register.get("/register", async (c) => {
  return c.text("REGISTER");
});

export default register;