import {Hono} from "hono";
import {cors} from "hono/cors";

const app = new Hono<AppEnv>();

app.use("*", cors({
	origin: ["https://dicyvpn.com", "http://localhost:8080"] // we can consider adding additional origins here if you don't use port 8080
}));

export default app;
