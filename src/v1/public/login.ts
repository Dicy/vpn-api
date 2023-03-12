import { Context, Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { accounts, refreshTokens } from "../../database";
import { obfuscate } from "../../utils/stringObfuscation";
import { Reply } from "../reply";
import { comparePassword } from "../../utils/passwords";
import { randomString } from "../../utils/randomString";
import { getTokenForAccount } from "./utils/token";

const REFRESH_TOKEN_EXPIRATION = 60 * 60 * 24 * 30 * 6; // 6 months

const login = new Hono<AppEnv>();
login.post("/login", zValidator("json", z.object({
  email: z.string().email().trim(),
  password: z.string().min(8).max(10_000)
  // TODO: Add captcha
})), async (c) => {
  const { email, password } = c.req.valid("json");

  const response = await accounts(c.env).findOne<AccountDocument>({
    filter: { email: obfuscate(email) },
    projection: { _id: true, password: true, permissionLevel: true }
  });

  if (!response || !response.document) {
    logFailedAttempt(c, email, "tried to login with wrong email");
    return Reply.unauthorized("Invalid email or password");
  }

  const account = response.document;
  const hash = account.password;
  if (!comparePassword(password, hash)) {
    logFailedAttempt(c, email, "tried to login with wrong password");
    return Reply.unauthorized("Invalid email or password");
  }
  // the password is correct
  // generate a refresh token with length between 128 and 256 characters
  const refreshToken = randomString(128, 256);
  // store it in the database
  const insertResponse = await refreshTokens(c.env).insertOne({
    document: {
      token: refreshToken,
      accountId: {
        $oid: account._id
      },
      userAgent: c.req.header("User-Agent") ?? "",
      ip: c.req.header("CF-Connecting-IP") ?? "",
      createdAt: {
        $date: { $numberLong: Date.now().toString() }
      },
      lastUsedAt: {
        $date: { $numberLong: Date.now().toString() }
      },
      expiresAt: {
        $date: { $numberLong: (Date.now() + REFRESH_TOKEN_EXPIRATION * 1000).toString() }
      }
    }
  });
  if (!insertResponse || !insertResponse.insertedId) {
    return Reply.serverError("Failed to create refresh token");
  }
  // generate a JWT
  const token = await getTokenForAccount(account, insertResponse.insertedId, c.env);
  return Reply.ok("OK", {
    "X-Auth-Token": token,
    "X-Auth-Refresh-Token": refreshToken
  });
});

export default login;

function logFailedAttempt(c: Context<AppEnv>, email: string, reason: string) {
  console.log(
    "IP", c.req.header("CF-Connecting-IP"),
    reason,
    email,
    c.req.header("User-Agent"),
    "at", new Date().toISOString()
  );
}
