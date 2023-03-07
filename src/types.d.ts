import type {Env as HonoEnv} from "hono";

export interface Env extends Record<string, unknown> {
}

declare global {
  export interface AppEnv extends HonoEnv {
    Bindings: Env;
  }
}
