import {Hono} from "hono";
import {cors} from "hono/cors";
import v1 from "./v1";
import beta from "./beta";

const app = new Hono<AppEnv>();

app.use("*", cors({
	origin(origin: string) {
		if (origin.startsWith("http://localhost")) {
			return origin;
		}
		return "https://dicyvpn.com";
	}
}));

app.route("/v1", v1);
app.route("/beta", beta);

export default app;
