// tslint:disable: no-var-requires
// tslint:disable: no-string-literal
const bcrypt = require("bcrypt");
import { Request, Response } from "express";
import { client } from "../../elasticsearch";

import { verify } from "jsonwebtoken";
import { createAccessToken, createRefreshToken } from "../../../config/auth";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { confirmation, forgotPass } from "./email";
const fetch = require("node-fetch");
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
    const resp = await pingGraphql(query);
    if (!resp.errors) {
      res.json(resp.data.users);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function getPaginatedUsers(req: Request, res: Response) {
  try {
    const variables = {
      lastDate: req.params.lastDate,
      id: req["payload"].userId
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
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.users);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function getUserById(req: Request, res: Response) {
  console.log('getuserbyid')
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
  const resp = await pingGraphql(query, variables);
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
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.createUser);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(400).send(error);
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
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.updateUser);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(400).send(error);
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
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.deleteUser);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(400).send(error);
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
    let user = null;
    const resp = await pingGraphql(query, variables);
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
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    console.log("logout");
    res.status(200).send("ok");
  } catch (error) {
    res.status(400).send(error);
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
    let resp = await pingGraphql(query, variables);
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
      resp = await pingGraphql(query, variables);
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
  } catch (error) {
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
    const resp = await pingGraphql(query, variables);
    if (!resp.errors && resp.data && resp.data.confirmUser) {
      res.send("User Confirmed");
    } else {
      res.status(400).send("Failed to Confirm User");
    }
  } catch (error) {
    res.status(400).send(error);
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
    const resp = await pingGraphql(query, variables);
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
        } catch (error) {
          console.log(error);
          res.status(500).send("Failed to send Forgot Password Link");
        }
      } else {
        res.status(404).send("Invalid Email");
      }
    } else {
      res.status(404).send("Invalid Email");
    }
  } catch (error) {
    res.status(500).send(error);
  }
  // }
};

export const doRefreshToken = async (req: Request, res: Response, next) => {
  console.log('doRefreshToken')
  const token = req.params.token;
  console.log(token)
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
    let user = null;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      user = resp.data.getUserById;
      console.log(user)
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

export const revokeRefreshTokens = async (req: Request, res: Response) => {
  try {
    const variables = {
      email: req.body.email,
    };
    const query = `mutation RevokeRefreshTokensForUser($email: String!) {
      revokeRefreshTokensForUser(email: $email)
    }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.send(resp.data.revokeRefreshTokensForUser);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(403).send(error);
  }
};

export const isAuth = (req: Request, res: Response, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.sendStatus(403);
  } else {
    try {
      // const token = authorization.split(" ")[1];
      const token = authorization;
      const payload = verify(token, process.env.ACCESS_TOKEN);
      req["payload"] = payload;
      return next();
    } catch (error) {
      res.status(403).send(error);
    }
  }
};

export const leave = async (req: Request, res: Response) => {
  // try {
  // console.log("leave");
  res.status(200).send("leave");
  // } catch (error) {
  //   res.status(403);
  // }
};
export const enter = async (req: Request, res: Response) => {
  // try {
  // console.log("enter");
  res.status(200).send("enter");
};

export const reset = async (req: Request, res: Response) => {
  console.log('reset')
  try {
    const variables = {
      resetPasswordToken: req.params.token,
    };

    const query = `mutation Reset($resetPasswordToken: String!) {
    reset(resetPasswordToken: $resetPasswordToken){
        id
      }
    }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.reset);
    } else {
      res.status(400).send("Password reset token is invalid or has expired.");
    }
  } catch (error) {
    res.status(400).send(error);
  }
};

export const change = async (req: Request, res: Response) => {
  const type = req.body.type;
  const tag = req.body.tag;
  try {
    if (type !== "user") {
      const esResp = await client.delete({
        id: tag,
        index: type,
        type: "_doc",
      });
      console.log(esResp);
    }
    const variables = {
      id: req["payload"].userId,
      type,
      tag,
    };
    const query = `mutation Change($id: String!, $type: String!, $tag: String!) {
        change(id: $id, type: $type, tag: $tag)
      }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.change);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(500).send(error);
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
    const resp = await pingGraphql(query, variables);
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
  } catch (error) {
    res.status(500).send(error);
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
    const resp = await pingGraphql(query, null);
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
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed Register");
  }
};

const getToken = async () => {
  try {
    console.log("getting transport");
    const { google } = require("googleapis");
    const OAuth2 = google.auth.OAuth2;

    const myOAuth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_SECRET,
      process.env.ORIGIN
    );

    myOAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH,
    });

    const myAccessToken = await myOAuth2Client.getAccessToken();
    if (myAccessToken && myAccessToken.token) {
      return myAccessToken.token;
    } else {
      return false;
    }
  } catch (error) {
    return error;
  }
};

const sendEmail = async (to: string, subject: string, body: string) => {
  try {
    const accessToken = await getToken();
    if (accessToken) {
      const encodedMail = Buffer.from(
        'Content-Type: text/html; charset="UTF-8"\n' +
          "MIME-Version: 1.0\n" +
          "Content-Transfer-Encoding: 7bit\n" +
          `to: ${to}\n` +
          "from: usersup@gmail.com\n" +
          `subject: ${subject}\n\n` +
          body
      )
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const resp = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: encodedMail,
          }),
        }
      );
      return await resp.json();
    } else {
      return false;
    }
  } catch (error) {
    return error;
  }
};
