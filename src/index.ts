// import socket from "socket.io";

import * as aws from "aws-sdk";

import app from "./App";
import CONFIG from "./config/config";

const https = require('https');
const fs = require('fs');

// import "../config/db";

const PORT = 3001;
let server
if(process.env.ORIGIN ==='https://9takes.com'){
  server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/9takes.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/9takes.com/fullchain.pem'),
  }, app).listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
  });
} else {
  server = app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
  });
}

// tslint:disable-next-line: no-var-requires
export const io = require("socket.io")(server, { origins: "*:*" });
export const redis = require("redis");
export const s3 = new aws.S3({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  region: "us-east-1",
});
