// tslint:disable: no-var-requires
// tslint:disable: no-string-literal
const bcrypt = require("bcrypt");
import { Request, Response } from "express";
import { client } from "../../elasticsearch";

import { sign, verify } from "jsonwebtoken";
import { createAccessToken, createRefreshToken } from "../../../config/auth";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { confirmation, forgotPass } from "./emailTemplates";
const saltRounds = 10;
import { notificationsSetup } from "../Notifications/notifications";
export async function getAll(req: Request, res: Response) {
  try {
    const query = `query Users() {
      users(){
        firstName
        lastName
        email
        enneagramId
        mbtiId
      }
    }`;
    const resp = await pingGraphql({ query, req });
    if (!resp.errors) {
      res.json(resp.data.users);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    res.status(400).send(e);
  }
}

export async function getPaginatedUsers(req: Request, res: Response) {
  try {
    const variables = {
      lastDate: req.params.lastDate,
      id: req["payload"].userId,
    };

    const query = `query Users($lastDate: String, $id: String!) {
      users(lastDate: $lastDate, id: $id){
        users{
          id
          firstName
          lastName
          email
          enneagramId
          mbtiId
          confirmedUser
          role
          dateCreated
          dateModified
        }
        count
      }
    }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp.data.users);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    res.status(400).send(e);
  }
}

export async function getUserById(req: Request, res: Response) {
  console.log("getuserbyid");
  const variables = {
    id: req["payload"].userId,
  };

  const query = `query GetUserById($id: String!) {
    getUserById(id: $id){
      id
      firstName
      lastName
      email
      enneagramId
      mbtiId
    }
  }`;
  const resp = await pingGraphql({ query, variables, req });
  if (!resp.errors) {
    res.json(resp.data.getUserById);
  } else {
    res.status(400).send(resp.errors);
  }
}

export async function addOne(req: Request, res: Response) {
  try {
    const variables = {
      firstName: req.body.FirstName,
      lastName: req.body.LastName,
      email: req.body.Email,
      enneagramId: req.body.EnneagramId,
      mbtiId: req.body.MBTIId,
    };

    const query = `mutation CreateUser($firstName: String!, $lastName: String!, $email: String!, $enneagramId: String!, $mbtiId String!) {
      createUser(firstName: $firstName, lastName: $lastName, email: $email, enneagramId: $enneagramId, mbtiId: $mbtiId)
        }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp.data.createUser);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    res.status(400).send(e);
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const variables = {
      id: req["payload"].userId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      enneagramId: req.body.enneagramId.toString(),
      mbtiId: req.body.mbtiId,
    };

    const query = `mutation UpdateUser($id: String!, $firstName: String, $lastName: String, $email: String, $enneagramId: String, $mbtiId: String) {
      updateUser(id: $id, firstName: $firstName, lastName: $lastName, email: $email, enneagramId: $enneagramId, mbtiId: $mbtiId) {
        firstName
        lastName
        email
        enneagramId
        mbtiId
      }
    }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp.data.updateUser);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    res.status(400).send(e);
  }
}

export async function deleteOneByEmail(req: Request, res: Response) {
  try {
    const variables = {
      email: req.body.email,
    };

    const query = `mutation DeleteUser($email: String) {
      deleteUser(email: $email)
    }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp.data.deleteUser);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    res.status(400).send(e);
  }
}

// https://www.youtube.com/watch?v=W021RQAL3NU

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const variables = {
      email,
    };

    const query = `query GetUserByEmail($email: String!) {
      getUserByEmail(email: $email){
        id
        firstName
        lastName
        password
        email
        enneagramId
        mbtiId
        tokenVersion
        confirmedUser
        role
      }
    }`;
    let user: any = null;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      if (!resp.data.getUserByEmail.confirmedUser) {
        res.status(400).send("Email not confirmed");
        return;
      }
      user = resp.data.getUserByEmail;
    } else {
      res.status(400).send(resp.errors);
    }

    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const refreshToken = createRefreshToken(user);
        // sendRefreshToken(res, refreshToken);
        const accessToken = createAccessToken(user);
        delete user.password;
        delete user.tokenVersion;
        return res.json({
          accessToken,
          user,
          refreshToken,
        });
      } else {
        res.status(401).send("Login Failed");
      }
    } else {
      res.status(401).send("Login Failed");
    }
  } catch (e) {
    res.status(400).send(e);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    console.log("logout");
    res.status(200).send("ok");
  } catch (e) {
    res.status(400).send(e);
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, enneagramType } = req.body;
  try {
    let variables: any = {
      email,
    };
    let query: string = `query GetUserByEmail($email: String!) {
      getUserByEmail(email: $email){
        email
        confirmationToken
        confirmedUser
      }
    }`;
    let resp = await pingGraphql({ query, variables, req });
    if (!resp.data.getUserByEmail && !resp.errors) {
      console.log("GetUserByEmail success");
      const hash = await bcrypt.hash(password, saltRounds);
      variables = {
        email,
        password: hash,
        enneagramType,
      };

      query = `mutation CreateUser($email: String!, $password: String!, $enneagramType: String!) {
        createUser(email: $email, password: $password, enneagramType: $enneagramType){
          email,
          confirmationToken
        }
          }`;
      resp = await pingGraphql({ query, variables, req });
      if (!resp.errors) {
        console.log("CreateUser success");
        const confirmationToken = resp.data.createUser.confirmationToken;
        if (confirmationToken) {
          return sendConfirmation(confirmationToken, email, res);
        } else {
          res.status(500).send("Failed Register");
        }
      } else {
        res.status(500).send("Failed Register");
      }
    } else {
      if (resp.errors) {
        return res.status(400).send("User already exists, try logging on");
      } else if (!resp.data.getUserByEmail.confirmedUser) {
        return sendConfirmation(
          resp.data.getUserByEmail.confirmationToken,
          email,
          res
        );
      }
      return res.status(400).send("User already exists, try logging on");
    }
  } catch (e) {
    res.status(500).send("Failed to Register User");
  }
}

export const confirmUser = async (req: Request, res: Response, next) => {
  const { confirmationToken } = req.params;
  try {
    const variables = {
      confirmationToken,
    };
    const query = `mutation ConfirmUser($confirmationToken: String!) {
      confirmUser(confirmationToken: $confirmationToken)
    }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors && resp.data && resp.data.confirmUser) {
      res.send("User Confirmed");
    } else {
      res.status(400).send("Failed to Confirm User");
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

export const forgotPassword = async (req: Request, res: Response, next) => {
  // revokeRefreshTokens
  const { email } = req.body;
  try {
    const variables = {
      email,
    };
    const query = `mutation Recover($email: String!) {
      recover(email: $email){
        resetPasswordToken
      }
    }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      const resetToken = resp.data.recover.resetPasswordToken;
      if (resetToken) {
        const link = process.env.ORIGIN + "/reset/" + resetToken;
        try {
          const sent: any = await sendEmail(
            email,
            "Forgot Password",
            forgotPass(link)
          );
          if (sent) {
            res.send("Email sent: " + sent.response);
          } else {
            res.status(500).send("Forgot Password Link not sent");
          }
        } catch (e) {
          console.log(e);
          res.status(500).send("Failed to send Forgot Password Link");
        }
      } else {
        res.status(404).send("Invalid Email");
      }
    } else {
      res.status(404).send("Invalid Email");
    }
  } catch (e) {
    res.status(500).send(e);
  }
  // }
};

export const doRefreshToken = async (req: Request, res: Response, next) => {
  console.log("doRefreshToken");
  const token = req.params.token;
  if (!token) {
    return res.send({ ok: false, accessToken: "" });
  }

  let payload: any = null;
  try {
    const strippedToken = token; // .split(' ')[1]
    payload = verify(strippedToken, process.env.REFRESH_TOKEN!);

    const variables = {
      id: payload.userId,
    };

    const query = `query GetUserById($id: String!) {
        getUserById(id: $id){
          id
          firstName
          lastName
          email
          enneagramId
          mbtiId
          tokenVersion
          role
        }
      }`;
    let user: any = null;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      user = resp.data.getUserById;
    } else {
      return res.status(400).send(resp.errors);
    }

    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    } else if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    } else {
      notificationsSetup(payload.userId);

      res.send({
        ok: true,
        accessToken: createAccessToken(user),
        refreshToken: createRefreshToken(user),
        user,
      });
      // this.getNotifications()
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ ok: false, accessToken: "" });
  }
};

export const authDoRefreshToken = async (req: Request, res: Response, next) => {
  console.log("authDoRefreshToken");
  const token = req.body.token;
  if (!token) {
    return res.send({ ok: false, accessToken: "" });
  }

  let payload: any = null;
  try {
    const strippedToken = token; // .split(' ')[1]
    payload = verify(strippedToken, process.env.REFRESH_TOKEN!);

    const variables = {
      id: payload.userId,
    };

    const query = `query GetUserById($id: String!) {
        getUserById(id: $id){
          id
          firstName
          lastName
          email
          enneagramId
          mbtiId
          tokenVersion
          role
        }
      }`;
    let user: any = null;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      user = resp.data.getUserById;
    } else {
      return res.status(400).send(resp.errors);
    }

    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    } else if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    } else {
      notificationsSetup(payload.userId);

      res.send({
        ok: true,
        accessToken: createAccessToken(user),
        refreshToken: createRefreshToken(user),
        user,
      });
      // this.getNotifications()
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ ok: false, accessToken: "" });
  }
};

export const getUser = async (req: Request, res: Response, next) => {
  try {
    console.log("getUser");
    let userId;
    // const ip = req['payload'].ip
    let rando;
    const token = parseAuthToken(req.headers.authorization);
    if (token !== "null") {
      if (token.includes(process.env.RANDO_PREFIX)) {
        rando = token;
      } else {
        const payload: any = verify(token, process.env.ACCESS_TOKEN);
        userId = payload.userId;
      }
    }
    if (!userId) {
      if (rando) {
        const variables = {
          id: rando,
        };

        const query = `query GetRando($id: String!) {
          getRando(id: $id) {
              id
              questions
            }
          }`;
        const resp = await pingGraphql({ query, variables, req });
        if (!resp.errors) {
          res.send({
            ok: true,
            accessToken: req.headers.authorization,
            user: resp.data.getRando,
          });
        } else {
          res.status(400).send(resp.errors);
        }
      } else {
        const randoToken = await sign(
          { ip: req.ip },
          process.env.ACCESS_TOKEN,
          {
            expiresIn: "30m",
          }
        );
        const randoId = `${process.env.RANDO_PREFIX}${randoToken}`;

        res.send({
          ok: true,
          accessToken: randoId,
          user: { id: randoId, questions: {} },
        });
      }
      return;
      // return res.send({ ok: false, accessToken: "" });
    }

    try {
      const variables = {
        id: userId,
      };

      const query = `query GetUserById($id: String!) {
        getUserById(id: $id){
          id
          firstName
          lastName
          email
          enneagramId
          mbtiId
          tokenVersion
          role
        }
      }`;
      let user = null;
      const resp = await pingGraphql({ query, variables, req });
      if (!resp.errors) {
        user = resp.data.getUserById;
      } else {
        return res.status(400).send(resp.errors);
      }

      if (!user) {
        return res.send({ ok: false, accessToken: "" });
      }
      // else if (user.tokenVersion !== req["payload"].tokenVersion) {
      //   return res.send({ ok: false, accessToken: "" });
      // }
      else {
        notificationsSetup(userId);

        res.send({
          ok: true,
          accessToken: createAccessToken(user),
          refreshToken: createRefreshToken(user),
          user,
        });
        // this.getNotifications()
      }
    } catch (err) {
      console.log(err);
      res.status(400).send({ ok: false, accessToken: "" });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send({ ok: false, accessToken: "" });
  }
};

export const revokeRefreshTokens = async (req: Request, res: Response) => {
  try {
    const variables = {
      email: req.body.email,
    };
    const query = `mutation RevokeRefreshTokensForUser($email: String!) {
      revokeRefreshTokensForUser(email: $email)
    }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.send(resp.data.revokeRefreshTokensForUser);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    res.status(403).send(e);
  }
};

export const parseAuthToken = (token) => {
  return token && token.includes("Bearer") ? token.split(" ")[1] : token;
};

export const isAuth = (req: Request, res: Response, next) => {
  const authToken = parseAuthToken(req.headers.authorization);
  if (!authToken) {
    res.sendStatus(403);
  } else {
    try {
      const payload = verify(authToken, process.env.ACCESS_TOKEN);
      req["payload"] = payload;
      return next();
    } catch (e) {
      res.status(403).send(e);
    }
  }
};

export const leave = async (req: Request, res: Response) => {
  // try {
  // console.log("leave");
  res.status(200).send("leave");
  // } catch (e) {
  //   res.status(403);
  // }
};
export const enter = async (req: Request, res: Response) => {
  // try {
  // console.log("enter");
  res.status(200).send("enter");
};

export const reset = async (req: Request, res: Response) => {
  console.log("reset");
  try {
    const variables = {
      resetPasswordToken: req.params.token,
    };

    const query = `mutation Reset($resetPasswordToken: String!) {
    reset(resetPasswordToken: $resetPasswordToken){
        id
      }
    }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp.data.reset);
    } else {
      res.status(400).send("Password reset token is invalid or has expired.");
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

export const change = async (req: Request, res: Response) => {
  const type = req.body.type;
  const tag = req.body.tag;
  try {
    if (type !== "user") {
      const exists = await client.get({
        id: tag,
        index: type,
        type: "_doc",
      });
      if (exists) {
        await client.delete({
          id: tag,
          index: type,
          type: "_doc",
        });
      }
    }
    const variables = {
      id: req["payload"].userId,
      type,
      tag,
    };
    const query = `mutation Change($id: String!, $type: String!, $tag: String!) {
        change(id: $id, type: $type, tag: $tag)
      }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp.data.change);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    res.status(500).send(e);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { password } = req.body;
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    const variables = {
      password: hash,
      resetPasswordToken: req.params.token,
    };
    const query = `mutation ResetPassword($password: String!, $resetPasswordToken: String!) {
      resetPassword(password: $password, resetPasswordToken: $resetPasswordToken){
        email
      }
    }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      const user = resp.data.resetPassword;
      const body = `Hi from 9takes \n 
      This is a confirmation that the password for your account ${user.email} has just been changed.\n`;
      const sent: any = await sendEmail(
        user.email,
        "Your password has been changed",
        body
      );
      if (sent) {
        res.send("Your password has been updated.");
      }
    } else {
      res.status(500).send("failure");
    }
  } catch (e) {
    res.status(500).send(e);
  }
};

export const sendAllUsers = async (req: Request, res: Response) => {
  if (req.params.password === process.env.EmailPassword) {
    const query = `query Users {
      users {
        email
        dateCreated
        enneagramId
      }
    }`;
    const resp = await pingGraphql({ query, req });
    if (!resp.errors) {
      const users = await JSON.stringify(resp.data.users);
      const sent: any = await sendEmail(
        process.env.FORGOT_PASSWORD_EMAIL,
        "Users",
        users
      );
      if (sent) {
        res.send("Email Sent");
      } else {
        res.status(500).send("failure");
      }
    } else {
      res.status(500).send("failure");
    }
  } else {
    res.status(500).send("error");
  }
};

const sendConfirmation = async (confirmationToken, email, res) => {
  try {
    console.log("got to sendConfirmation");
    const link = process.env.ORIGIN + "/confirm/" + confirmationToken;
    console.log("sending email");
    const sent: any = await sendEmail(
      email,
      "Confirm Email Address",
      confirmation(link)
    );
    if (sent) {
      return res.send("Confirmation email sent: " + email);
    } else {
      res.status(500).send("Failed to Generate Confirmation Email");
    }
  } catch (e) {
    console.log(e);
    res.status(500).send("Failed Register");
  }
};

const makeBody = (toEmails, fromEmail, subject, message) => {
  const str = [
    'Content-Type: text/html; charset="UTF-8"\n',
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    `to: ${toEmails.join(",")}\n`,
    `from: ${fromEmail}\n`,
    `subject: ${subject}\n\n`,
    message,
  ].join("");

  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export const sendEmail = async (to: string, subject: string, body: string) => {
  try {
    const { google } = require("googleapis");
    const authClient = new google.auth.JWT(
      "id-takes-gmail-service-account@smart-mark-302504.iam.gserviceaccount.com",
      null,
      process.env.private_key,
      ["https://www.googleapis.com/auth/gmail.send"],
      "usersup@9takes.com"
    );
    const gmail = google.gmail({
      auth: authClient,
      version: "v1",
    });

    return await gmail.users.messages.send({
      requestBody: {
        raw: makeBody([to], "usersup@9takes.com", subject, body),
      },
      userId: "me",
    });
  } catch (e) {
    console.log(e);
    return false;
  }
};
