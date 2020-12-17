import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";

const formidable = require("formidable");
const fs = require("fs");

const imagemin = require("imagemin");
const mozjpeg = require("imagemin-mozjpeg");
const isJpg = require("is-jpg");
// tslint:disable-next-line: no-var-requires
const sharp = require("sharp");
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../../..";

export async function addContent(req: Request, res: Response) {
  try {
    // tslint:disable-next-line: no-string-literal
    if (req["file"] || req["files"]) {
      console.log("contains file");
    } else {
      console.log("no file");
    }
    let id = null;
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (fields.text) {
        const esResp = await client.index({
          index: req.params.type,
          type: "_doc",
          body: {
            // tslint:disable-next-line: no-string-literal
            authorId: req["payload"].userId,
            text: fields.text,
          },
        });
        id = esResp._id;
      }

      let imgKey = "";
      if (files.img) {
        imgKey = await getImage(files.img);
      }
      const variables = {
        id: id ? id : null,
        // tslint:disable-next-line: no-string-literal
        userId: req["payload"].userId,
        enneagramType: req.params.type,
        text: fields.text,
        img: imgKey,
      };

      const query = `mutation CreateContent($id: String, $userId: String!, $text: String, $img: String, $enneagramType: String!) {
        createContent(id: $id, userId: $userId, text: $text, img: $img, enneagramType: $enneagramType) {
            userId
            text
            img
            likes
            comments{
              id
              comment
              likes
              author {
                id
                enneagramId
              }
              comments {
                id
              }
            }
        }
      }`;
      const resp = await pingGraphql(query, variables);
      if (!resp.errors) {
        res.json(resp.data.createContent);
      } else {
        res.status(400).send(resp.errors);
      }
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function getContent(req: Request, res: Response) {
  try {
    const variables = {
      enneagramType: req.params.type,
      text: req.body.text,
      img: req.body.img,
    };

    const query = `query Content($enneagramType: String!) {
        content(enneagramType: $enneagramType) {
            userId
            text
            img
            likes
            comments {
              id
              comment
              likes
              author {
                id
                enneagramId
              }
              comments {
                id
              }
            }
        }
      }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.content);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

const convertToJpg = async (input: Buffer) => {
  if (isJpg(input)) {
    return input;
  }

  return sharp(input).jpeg().toBuffer();
};

export const uploadBuffer = async (img) => {
  console.log("test");
  const miniBuffer = await imagemin.buffer(img, {
    plugins: [convertToJpg, mozjpeg({ quality: 85 })],
  });

  const Key = uuidv4();
  try {
    await s3
      .putObject({
        Bucket: process.env.S3_BUCKET as string,
        Key,
        Body: miniBuffer,
        ContentType: "JPEG",
        ACL: "public-read",
      })
      .promise();
    return Key;
  } catch (error) {
    console.log(error);
  }
};

export const getImage = async (img: any) => {
  const buffers: Uint8Array[] = [];
  let newBuffer;
  const readableStream = await img;

  const buffer = new Promise<Buffer | null>(async (res) =>
    fs
      .createReadStream(readableStream.path)
      .on("data", (chunk: Uint8Array) => {
        buffers.push(chunk);
      })
      .on("end", () => {
        newBuffer = Buffer.concat(buffers);
        res(Buffer.concat(buffers));
      })
      .on("error", (err: any) => {
        res(null);
      })
  );

  if (!buffer) {
    return null;
  }
  await buffer;

  return uploadBuffer(newBuffer);
};

export async function addContentLike(req: Request, res: Response) {
  try {
    const variables = {
      // tslint:disable-next-line: no-string-literal
      userId: req["payload"].userId,
      id: req.params.contentId,
      type: "content",
      operation: req.params.operation,
    };

    const query = `mutation AddLike($userId: String!, $id: String!, $type: String!, $operation: String!) {
          addLike(userId: $userId, id: $id, type: $type, operation: $operation)
        }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}
