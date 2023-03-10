import type {Env as HonoEnv} from "hono";

export interface Env extends Record<string, unknown> {
  TOKEN_SECRET: string; // the secret used to sign JWTs
  DATABASE: string; // Database name
  DATA_API_URL: string; // MongoDB Data API URL
  DATA_API_KEY: string; // MongoDB Data API Key
  SENDGRID_API_URL: string;
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string; // the email address to send emails from
}

declare global {
  export interface AppEnv extends HonoEnv {
    Bindings: Env;
  }
}
