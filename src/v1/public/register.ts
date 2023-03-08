import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { Env } from "../../types";
import { accounts } from "../../database";
import { obfuscate } from "../../utils/stringObfuscation";
import { Reply } from "../reply";


const register = new Hono<AppEnv>();
register.post("/register", zValidator("json", z.object({
  name: z.string().min(4).max(32).trim(),
  email: z.string().email().trim(),
  password: z.string().min(8).max(10_000).trim()
  // TODO: Add captcha
})), async (c) => {
  const data = c.req.valid("json");

  if (!await isEmailAvailable(data.email, c.env)) {
    return Reply.conflict("Email is already in use");
  }

  // TODO: Implement registration
  return c.text("REGISTER with data: " + JSON.stringify(data));
});

export default register;


export async function isEmailAvailable(email: string, env: Env): Promise<boolean> {
  const response = await accounts(env).findOne({
    filter: { email: obfuscate(email.toLowerCase()) }
  });
  return response && response.document !== null;
}