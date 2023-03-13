import { Hono } from "hono";

import register from "./public/register";
import login from "./public/login";
import refreshToken from "./public/refreshToken";
import passwordReset from "./public/passwordReset";
import { authMiddleware } from "../utils/authMiddleware";
import logout from "./logout";
import { betaConfigs } from "../database";

const v1 = new Hono<AppEnv>();

const publicRoutes = new Hono<AppEnv>();
publicRoutes.route("/", register);
publicRoutes.route("/", login);
publicRoutes.route("/", passwordReset);
publicRoutes.route("/", refreshToken);
v1.route("/public", publicRoutes);

v1.use("*", authMiddleware);
v1.route("/", logout);

v1.get("/getWireGuardConfig/:id{[A-Z]+_[0-9]+}", async (c) => {
  const id = c.req.param("id");
  const response = await betaConfigs(c.env).findOne({ filter: { type: "wireguard", serverId: id } });
  if (!response || !response.document) {
    c.status(404);
    return c.text("Not found");
  }
  return c.json(response.document);
});

export default v1;
