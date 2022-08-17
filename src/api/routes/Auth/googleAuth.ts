const { google } = require("googleapis");
import { sign } from "jsonwebtoken";
export const getClient = async () => {
  try {
    // const payload = {
    //   iss: process.env.client_email,
    //   sub: process.env.client_email,
    //   scope: "https://www.googleapis.com/auth/gmail.send",
    //   aud: "https://www.googleapis.com/oauth2/v4/token",
    // };

    // // const stringPayload = JSON.stringify(payload);
    // const token = sign(payload, process.env.private_key, {
    //   algorithm: "RS256",
    //   header: {
    //     alg: "RS256",
    //     typ: "JWT",
    //     kid: process.env.private_key_id,
    //   },
    //   expiresIn: "1h"
    // });

    // const options = {
    //   method: "POST",
    //   uri: "https://www.googleapis.com/oauth2/v4/token",
    //   body: {
    //     grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    //     assertion: token,
    //   },
    //   json: true,
    // };
    // const resp = await rp(options)
    // return resp.access_token

    const JWT = google.auth.JWT;
    const authClient = new JWT({
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      keyFile: "googleAuth.json",
      subject: "usersup@9takes.com", // google admin email address to impersonate
    });
    await authClient.authorize();
  } catch (e) {
    console.log(e);
    return null;
  }
};
