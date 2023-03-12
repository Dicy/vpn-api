import type {Env as HonoEnv} from "hono";

interface Env extends Record<string, unknown> {
  TOKEN_SECRET: string; // the secret used to sign JWTs
  INVALIDATED_TOKENS: KVNamespace; // contains IDs of invalidated refresh tokens
  DATABASE: string; // database name
  DATA_API_URL: string; // MongoDB Data API URL
  DATA_API_KEY: string; // MongoDB Data API Key
  SENDGRID_API_URL: string;
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string; // the email address to send emails from
  SENDGRID_FROM_NAME: string;
}

declare global {
  export interface AppEnv extends HonoEnv {
    Bindings: Env;
    Variables: {
      isPublic: boolean;
      accountId: string;
      refreshTokenId: string;
    }
  }
}
