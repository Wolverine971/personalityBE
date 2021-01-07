// tslint:disable-next-line: no-var-requires
const bcrypt = require("bcrypt");
import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { createAccessToken, createRefreshToken } from "../../../config/auth";
import { pingGraphql } from "../../../helpers/pingGraphql";
const saltRounds = 10;

import { notificationsSetup } from '../Notifications/notifications'
export async function getAll(req: Request, res: Response): Promise<any> {
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

export async function getUser(req: Request, res: Response) {
  const variables = {
    // tslint:disable-next-line: no-string-literal
    email: req["payload"].userId,
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
      // tslint:disable-next-line: no-string-literal
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
      // tslint:disable-next-line: no-string-literal
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
      }
    }`;
    let user = null;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
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
    res.status(400);
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, enneagramType } = req.body;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    const variables = {
      email,
      password: hash,
      enneagramType
    };

    const query = `mutation CreateUser($email: String!, $password: String!, $enneagramType: String!) {
      createUser(email: $email, password: $password, enneagramType: $enneagramType)
        }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      return res.send("User Created");
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(400).send("Failed to Register User");
  }
}

export const forgotPassword = async (req: Request, res: Response, next) => {
  // revokeRefreshTokens
  const { email } = req.body;
  try {
    const variables = {
      email,
    };
    const query = `mutation RevokeRefreshTokensForUser($email: String!) {
      revokeRefreshTokensForUser(email: $email)
    }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.FORGOT_PASSWORD_EMAIL,
          pass: process.env.FORGOT_PASSWORD_EMAIL_PASSWORD,
        },
      });

      // todo send actual reset link
      const mailOptions = {
        from: process.env.FORGOT_PASSWORD_EMAIL,
        to: email,
        subject: "Forgot Password",
        html: "<h1>Forgot Password Link</h1><p>That was easy!</p>",
      };
      try {
        const sent = await transporter.sendMail(mailOptions);
        if (sent) {
          res.send("Email sent: " + sent.response);
        }
      } catch (error) {
        console.log(error);
        res.status(400).send("Failed to send Forgot Password Link");
      }
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    res.status(400).send(error);
  }
  // }
};

export const doRefreshToken = async (req: Request, res: Response, next) => {
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
        }
      }`;
    let user = null;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      user = resp.data.getUserById;
    } else {
      res.status(400).send(resp.errors);
    }

    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    } else if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    } else {
      notificationsSetup(payload.userId)

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
      // tslint:disable-next-line: no-string-literal
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
  // } catch (error) {
  //   res.status(403);
  // }
};
