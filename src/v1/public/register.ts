import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import jwt from "@tsndr/cloudflare-worker-jwt";

import { Env } from "../../types";
import { accounts, pendingAccounts } from "../../database";
import { deobfuscate, obfuscate } from "../../utils/stringObfuscation";
import { Reply } from "../reply";
import { hashPassword } from "../../utils/passwords";
import PermissionLevel from "../../permissionLevel";
import sendEmail from "../../utils/emails";

const VERIFICATION_EXPIRATION = 60 * 60 * 24; // 24 hours

const register = new Hono<AppEnv>();
register.post("/register", zValidator("json", z.object({
  name: z.string().min(4).max(32).trim(),
  email: z.string().email().trim(),
  password: z.string().min(8).max(10_000)
  // TODO: Add captcha
})), async (c) => {
  const { name, email, password } = c.req.valid("json");

  if (!await isEmailAvailable(email, c.env)) {
    return Reply.conflict("Email is already in use");
  }

  const hash = hashPassword(password);
  // add account to the pending verification collection
  const response = await pendingAccounts(c.env).insertOne({
    document: {
      name,
      email: obfuscate(email.toLowerCase()),
      password: hash,
      createdAt: {
        $date: { $numberLong: Date.now().toString() }
      },
      permissionLevel: PermissionLevel.USER
    }
  });

  if (!response || !response.insertedId) {
    return Reply.serverError("Failed to create account");
  }

  console.info("Account created, insertId:", response.insertedId);

  // send verification email
  const verificationToken = await jwt.sign({
    accountId: response.insertedId,
    exp: Math.floor(Date.now() / 1000) + VERIFICATION_EXPIRATION
  }, c.env.TOKEN_SECRET);

  await sendEmail({
    to: email.toLowerCase(), // make sure the email matches the one we store
    type: "verify-email",
    data: {
      name,
      verificationToken
    }
  }, c.env);
  return Reply.ok("Account created and verification email sent");
});

register.post("/verify-email", zValidator("json", z.object({
  verificationToken: z.string().min(1).max(10_000)
})), async (c) => {
  const { verificationToken } = c.req.valid("json");
  const isValid: boolean = await jwt.verify(verificationToken, c.env.TOKEN_SECRET);
  if (!isValid) {
    return Reply.unauthorized("Invalid verification token");
  }

  const { payload: { accountId } } = jwt.decode(verificationToken);
  // get the pending account from the database
  const response = await pendingAccounts(c.env).findOne({
    filter: { _id: { $oid: accountId } }
  });
  if (!response || !response.document) {
    return Reply.serverError("Failed to find account, please try again");
  }
  console.info("Deleting pending account with id:", accountId);
  // delete the pending account
  await pendingAccounts(c.env).deleteOne({
    filter: { _id: { $oid: accountId } }
  });

  const email = deobfuscate(response.document.email);
  console.info("Creating account with email:", email);

  // check if the email is already in use (another account was created in the meantime)
  if (!await isEmailAvailable(email, c.env)) {
    console.info("Email is already in use, aborting account creation");
    return Reply.conflict("This email is linked to another account");
  }

  // add the account to the accounts collection
  console.warn("DELETE:", response.document._id);
  delete response.document._id;
  console.info("Inserting account:", response.document);
  const accountResponse = await accounts(c.env).insertOne({
    document: response.document
  });
  if (!accountResponse || !accountResponse.insertedId) {
    console.error("Failed to create account:", accountResponse);
    return Reply.serverError("Failed to verify account");
  }
  console.info("Account created with id:", accountResponse.insertedId);

  // send welcome email
  await sendEmail({
    to: email,
    type: "email-verified",
    data: {
      name: response.document.name
    }
  }, c.env);
  return Reply.ok("Account verified");
});

export default register;


export async function isEmailAvailable(email: string, env: Env): Promise<boolean> {
  const response = await accounts(env).findOne({
    filter: { email: obfuscate(email.toLowerCase()) }
  });
  return response && response.document === null;
}
