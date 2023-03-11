import { Env } from "../../../types";
import jwt from "@tsndr/cloudflare-worker-jwt";

const TOKEN_EXPIRATION = 60 * 10; // 10 minutes

export async function getTokenForAccount(account: AccountDocument, refreshTokenId: string, env: Env) {
  return await jwt.sign({
    _id: account._id,
    refreshTokenId: refreshTokenId,
    permissionLevel: account.permissionLevel.$numberInt,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION
  }, env.TOKEN_SECRET);
}
