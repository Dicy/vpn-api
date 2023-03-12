import { Hono } from "hono";
import { refreshTokens } from "../database";
import { Reply } from "./reply";
import { TOKEN_EXPIRATION } from "./public/utils/token";

const logout = new Hono<AppEnv>();

logout.get("/logout", async (c) => {
  // invalidate the refresh token and remove it from the database
  const refreshTokenId = c.get("refreshTokenId");
  await c.env.INVALIDATED_TOKENS.put(refreshTokenId, "true", { expirationTtl: TOKEN_EXPIRATION });

  // remove the refresh token from the database
  const response = await refreshTokens(c.env).deleteOne({
    filter: {
      _id: { $oid: c.get("refreshTokenId") }
    }
  });

  if (!response) {
    return Reply.serverError("Failed to delete refresh token, try again");
  }

  return Reply.ok("Logged out");
});

export default logout;
