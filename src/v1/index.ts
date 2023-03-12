import { Hono } from "hono";

import register from "./public/register";
import login from "./public/login";
import refreshToken from "./public/refreshToken";
import passwordReset from "./public/passwordReset";
import { authMiddleware } from "../utils/authMiddleware";
import logout from "./logout";

const v1 = new Hono<AppEnv>();

const publicRoutes = new Hono<AppEnv>();
publicRoutes.route("/", register);
publicRoutes.route("/", login);
publicRoutes.route("/", passwordReset);
publicRoutes.route("/", refreshToken);
v1.route("/public", publicRoutes);

v1.use("*", authMiddleware);
v1.route("/", logout);

export default v1;
