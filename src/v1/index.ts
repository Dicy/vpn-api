import {Hono} from "hono";
import register from "./public/register";

const v1 = new Hono<AppEnv>();

const publicRoutes = new Hono<AppEnv>();
publicRoutes.route("/", register);
// publicRoutes.route("/", login);
// publicRoutes.route("/", requestPasswordReset);
// publicRoutes.route("/", resetPassword);
// publicRoutes.route("/", verifyEmail);
// publicRoutes.route("/", refreshToken);

v1.route("/public", publicRoutes);

export default v1;