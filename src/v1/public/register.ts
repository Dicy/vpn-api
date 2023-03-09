import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import jwt from "@tsndr/cloudflare-worker-jwt";

import { Env } from "../../types";
import { accounts, pendingAccounts } from "../../database";
import { obfuscate } from "../../utils/stringObfuscation";
import { Reply } from "../reply";
import { hashPassword } from "../../utils/passwords";
import PermissionLevel from "../../permissionLevel";
import sendEmail from "../../utils/emails";

const VERIFICATION_EXPIRATION = 60 * 60 * 24; // 24 hours

const register = new Hono<AppEnv>();
register.post("/register", zValidator("json", z.object({
  name: z.string().min(4).max(32).trim(),
  email: z.string().email().trim(),
  password: z.string().min(8).max(10_000).trim()
  // TODO: Add captcha
})), async (c) => {
  const { name, email, password } = c.req.valid("json");

  if (!await isEmailAvailable(email, c.env)) {
    return Reply.conflict("Email is already in use");
  }

  const hash = hashPassword(password);
  // add account to the pending verification collection
  const response = await pendingAccounts(c.env).insertOne({
    document: {
      name,
      email: obfuscate(email.toLowerCase()),
      password: hash,
      createdAt: {
        $date: { $numberLong: Date.now().toString() }
      },
      permissionLevel: PermissionLevel.USER
    }
  });

  if (!response || !response.insertedId) {
    return Reply.serverError("Failed to create account");
  }

  // send verification email
  const verificationToken = await jwt.sign({
    // @ts-ignore
    accountId: response.insertedId.$oid,
    exp: Math.floor(Date.now() / 1000) + VERIFICATION_EXPIRATION
  }, c.env.TOKEN_SECRET);

  await sendEmail({
    to: email.toLowerCase(), // make sure the email matches the one we store
    type: "verify-email",
    data: {
      name,
      verificationToken
    }
  }, c.env);
  return Reply.ok("Account created and verification email sent");
});

export default register;


export async function isEmailAvailable(email: string, env: Env): Promise<boolean> {
  const response = await accounts(env).findOne({
    filter: { email: obfuscate(email.toLowerCase()) }
  });
  return response && response.document !== null;
}