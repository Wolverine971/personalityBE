import { Response } from "express";
import { sign } from "jsonwebtoken";


// tslint:disable-next-line: no-submodule-imports
import "dotenv/config";

export const createAccessToken = (user) => {
  return sign({ userId: user.email }, process.env.ACCESS_TOKEN, {
    expiresIn: "15m",
  });
};

export const createRefreshToken = (user) => {
  return sign(
    { userId: user.email, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN,
    {
      expiresIn: "7d",
    }
  );
};

export const sendRefreshToken = (res: Response, token: string) => {
  res = res.cookie("djtest", token, {
    httpOnly: true,
    path: "/",
  });
  return res;
};
