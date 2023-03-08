import type {Env as HonoEnv} from "hono";

export interface Env extends Record<string, unknown> {
  DATA_API_URL: string; // MongoDB Data API URL
  DATA_API_KEY: string; // MongoDB Data API Key
}

declare global {
  export interface AppEnv extends HonoEnv {
    Bindings: Env;
  }
}
