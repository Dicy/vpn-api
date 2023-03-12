import { HTTPException } from "hono/http-exception";
import { Context, MiddlewareHandler } from "hono";
import jwt from "@tsndr/cloudflare-worker-jwt";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const credentials = c.req.headers.get("Authorization");

  if (credentials) {
    const parts = credentials.split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      sendMalformedAuthHeaderError(c);
      return;
    }
    if (parts[0].toLowerCase() !== "bearer") {
      sendMalformedAuthHeaderError(c);
      return;
    }
    const token = parts[1];
    // check if the token is valid
    try {
      const isValid = await jwt.verify(token, c.env.TOKEN_SECRET);
      if (!isValid) {
        sendInvalidTokenError(c, "invalid token");
        return;
      }
    } catch (e: any) {
      sendInvalidTokenError(c, `${e}`)
      return;
    }

    const { payload } = jwt.decode(token);
    // check if the token is invalidated
    const invalidated = await c.env.INVALIDATED_TOKENS.get(payload.refreshTokenId);
    if (invalidated) {
      sendInvalidTokenError(c, "token invalidated");
    }

    c.set("accountId", payload._id);
    c.set("refreshTokenId", payload.refreshTokenId);
    return await next();
  }
  throwMissingToken(c);
};

function sendMalformedAuthHeaderError(c: Context) {
  const res = new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Bearer realm="${c.req.url}",error="invalid_request",error_description="invalid credentials structure"`
    }
  });
  throw new HTTPException(401, { res });
}

function throwMissingToken(c: Context) {
  const res = new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Bearer realm="${c.req.url}",error="invalid_request",error_description="no authorization included in request"`
    }
  });
  throw new HTTPException(401, { res });
}

function sendInvalidTokenError(c: Context, message: string) {
  const res = new Response("Unauthorized", {
    status: 401,
    statusText: message,
    headers: {
      "WWW-Authenticate": `Bearer realm="${c.req.url}",error="invalid_token",error_description="token verification failure"`
    }
  });
  throw new HTTPException(401, { res });
}
