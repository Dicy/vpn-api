import {Hono} from "hono";
import register from "./public/register";
import login from "./public/login";
import refreshToken from "./public/refreshToken";
import passwordReset from "./public/passwordReset";

const v1 = new Hono<AppEnv>();

const publicRoutes = new Hono<AppEnv>();
publicRoutes.route("/", register);
publicRoutes.route("/", login);
publicRoutes.route("/", passwordReset);
// publicRoutes.route("/", resetPassword);
publicRoutes.route("/", refreshToken);

v1.route("/public", publicRoutes);

export default v1;
