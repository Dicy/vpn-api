import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { accounts, passwordResetTokens } from "../../database";
import { deobfuscate, obfuscate } from "../../utils/stringObfuscation";
import { Reply } from "../reply";
import { randomString } from "../../utils/randomString";
import sendEmail from "../../utils/emails";
import { hashPassword } from "../../utils/passwords";
import { Env } from "../../types";

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
          $date: { $numberLong: Date.now().toString() }
        },
        expiresAt: {
          $date: { $numberLong: (Date.now() + PASSWORD_RESET_EXPIRATION * 1000).toString() }
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

passwordReset.post("/password/reset", zValidator("json", z.object({
  resetId: z.string(),
  resetToken: z.string(),
  password: z.string().min(8).max(10_000)
})), async (c) => {
  const { resetId, resetToken, password } = c.req.valid("json");
  const response = await passwordResetTokens(c.env).findOne({
    filter: {
      _id: {
        $oid: resetId
      },
      token: resetToken,
      expiresAt: { $gt: { $date: { $numberLong: Date.now().toString() } } }
    },
    projection: {
      accountId: true
    }
  });
  if (!response) {
    return Reply.serverError("Couldn't load your reset request, please try again");
  }
  if (!response.document) {
    return Reply.badRequest("Invalid reset token, please request a new one");
  }
  // we have a valid reset token, let's delete the token and update the password
  const deleteResponse = await passwordResetTokens(c.env).deleteOne({
    filter: { _id: { $oid: resetId } }
  });
  if (!deleteResponse || !deleteResponse.deletedCount) {
    console.error("Failed to delete reset token", JSON.stringify(deleteResponse), "for account", response.document.accountId);
    return Reply.serverError("Failed to reset your password, please try again");
  }

  const hash = hashPassword(password);
  const updateResponse = await accounts(c.env).updateOne({
    filter: { _id: response.document.accountId },
    update: {
      $set: {
        password: hash
      }
    }
  });
  if (!updateResponse || !updateResponse.matchedCount) {
    console.error("Failed to update password", JSON.stringify(updateResponse), "for account", response.document.accountId);
    return Reply.serverError("Failed to reset your password, please try again");
  }
  c.executionCtx.waitUntil(sendPasswordChangedEmail(response.document.accountId, c.env));
  return Reply.ok("Your password has been reset");
});

export default passwordReset;

async function sendPasswordChangedEmail(accountId: ObjectId, env: Env) {
  const account = await accounts(env).findOne({
    filter: {
      _id: accountId
    },
    projection: {
      name: true,
      email: true
    }
  });
  if (!account || !account.document) {
    console.error("Failed to load account", accountId, account);
    return;
  }
  await sendEmail({
    to: deobfuscate(account.document.email),
    type: "password-recovered",
    data: {
      name: account.document.name
    }
  }, env);
}
