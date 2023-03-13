import {Hono} from "hono";
import {cors} from "hono/cors";
import v1 from "./v1";

const app = new Hono<AppEnv>();

app.use("*", cors({
	origin(origin: string) {
		if (origin.startsWith("http://localhost")) {
			return origin;
		}
		return "https://dicyvpn.com";
	},
	exposeHeaders: ["X-Auth-Token", "X-Auth-Refresh-Token"],
}));

app.route("/v1", v1);

export default app;
