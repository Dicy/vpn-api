import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { accounts, passwordResetTokens } from "../../database";
import { deobfuscate, obfuscate } from "../../utils/stringObfuscation";
import { Reply } from "../reply";
import { randomString } from "../../utils/randomString";
import sendEmail from "../../utils/emails";

const PASSWORD_RESET_EXPIRATION = 60 * 60 * 12; // 12 hours


const passwordReset = new Hono<AppEnv>();

passwordReset.post("/password/request-reset", zValidator("json", z.object({
  email: z.string().email().trim().toLowerCase()
})), async (c) => {
  const { email } = c.req.valid("json");
  const account = await accounts(c.env).findOne({
    filter: {
      email: obfuscate(email)
    },
    projection: {
      _id: true,
      name: true,
      email: true
    }
  });
  if (!account) {
    return Reply.serverError("Couldn't load your account, please try again");
  }
  if (account.document) {
    const token = randomString(96, 128);
    const response = await passwordResetTokens(c.env).insertOne({
      document: {
        accountId: {
          $oid: account.document._id
        },
        token,
        createdAt: {
          $date: {$numberLong: Date.now().toString()}
        },
        expiresAt: {
          $date: {$numberLong: (Date.now() + PASSWORD_RESET_EXPIRATION * 1000).toString()}
        }
      }
    });

    if (response && response.insertedId) {
      await sendEmail({
        to: deobfuscate(account.document.email),
        type: "request-password-reset",
        data: {
          name: account.document.name,
          resetId: response.insertedId,
          resetToken: token
        }
      }, c.env);
      // do not confirm the request to prevent account enumeration
    } else {
      console.error("Failed to insert reset token", JSON.stringify(response));
      // unfortunately, we can't tell the user that the request failed
      // because that would allow account enumeration in case of a database error
    }
  }
  return Reply.ok("If the account exists, an email has been sent");
});

export default passwordReset;
