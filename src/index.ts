// import socket from "socket.io";

import * as aws from "aws-sdk";
const https = require('https');
import app from "./App";
import CONFIG from "./config/config";

// import "../config/db";

const PORT = 3001;

const server = https.createServer(app).listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

// tslint:disable-next-line: no-var-requires
export const io = require("socket.io")(server, { origins: "*:*" });
export const redis = require("redis");
export const s3 = new aws.S3({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  region: "us-east-1",
});
