import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { accounts, refreshTokens } from "../../database";
import { Reply } from "../reply";
import { getTokenForAccount } from "./utils/token";

const refreshToken = new Hono<AppEnv>();

refreshToken.post("/refresh-token", zValidator("json", z.object({
  refreshToken: z.string().max(1000),
  refreshTokenId: z.string(),
  accountId: z.string()
})), async (c) => {
  const { refreshToken, refreshTokenId, accountId } = c.req.valid("json");
  // check if the refresh token is valid
  const response = await refreshTokens(c.env).findOne({
    filter: {
      _id: { $oid: refreshTokenId },
      token: refreshToken,
      accountId: { $oid: accountId },
      expiresAt: { $gt: { $date: { $numberLong: Date.now().toString() } } }
    }
  });
  if (!response || !response.document) {
    return Reply.unauthorized("Invalid refresh token");
  }
  // get the account
  const accountResponse = await accounts(c.env).findOne<AccountDocument>({
    filter: {
      _id: { $oid: accountId }
    },
    projection: { _id: true, password: true, permissionLevel: true }
  });
  if (!accountResponse) {
    return Reply.serverError("Failed to get account");
  }
  if (!accountResponse.document) {
    return Reply.unauthorized("Invalid refresh token");
  }
  const account = accountResponse.document;
  // generate a new JWT
  const token = await getTokenForAccount(account, refreshTokenId, c.env);
  // update the refresh token info
  await refreshTokens(c.env).updateOne({
    filter: { _id: { $oid: refreshTokenId } },
    update: {
      $set: {
        lastUsedAt: {
          $date: { $numberLong: Date.now().toString() }
        }
      }
    }
  });

  return Reply.ok("OK", {
    "X-Auth-Token": token
  });
});

export default refreshToken;
