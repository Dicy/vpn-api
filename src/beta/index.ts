import {Hono} from "hono";
import { betaConfigs } from "../database";


const beta = new Hono<AppEnv>();

beta.get("/getWireGuardConfig/:id{[A-Z]+_[0-9]+}", async (c) => {
  const id = c.req.param("id");
  const response = await betaConfigs(c.env).findOne({ filter: { type: "wireguard", serverId: id } });
  if (!response || !response.document) {
    c.status(404);
    return c.text("Not found");
  }
  return c.json(response.document);
});

export default beta;