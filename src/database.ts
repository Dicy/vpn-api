import { createMongoDBDataAPI, MongoDBDataAPI } from "@alexdicy/mongodb-data-api";
import { Env } from "./types";

export const getDatabase = (env: Env) => createMongoDBDataAPI({
  urlEndpoint: env.DATA_API_URL,
  apiKey: env.DATA_API_KEY
}).$cluster("MainCluster").$database("dicyvpn");

const collections: Record<string, Omit<MongoDBDataAPI, "$cluster" | "$collection" | "$database">> = {};

export const accounts = (env: Env) => {
  return collections["accounts"] || (collections["accounts"] = getDatabase(env).$collection("accounts"));
};

// accounts pending email verification
export const pendingAccounts = (env: Env) => {
  return collections["pendingAccounts"] || (collections["pendingAccounts"] = getDatabase(env).$collection("pendingAccounts"));
}