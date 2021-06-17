import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";

// tslint:disable: no-string-literal
// tslint:disable: no-var-requires
const formidable = require("formidable");
const fs = require("fs");
const imagemin = require("imagemin");
const mozjpeg = require("imagemin-mozjpeg");
const isJpg = require("is-jpg");
const sharp = require("sharp");
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../../..";
export async function addContent(req: Request, res: Response) {
  try {
    const fields = await parseForm(req);
    let id = null;

    if (fields.text) {
      const esResp = await client.index({
        index: req.params.type,
        type: "_doc",
        body: {
          authorId: req["payload"].userId,
          text: fields.text,
          comments: 0,
          likes: 0,
          createdDate: new Date(),
        },
      });
      id = esResp._id;
    }
    const variables = {
      id: id ? id : null,
      userId: req["payload"].userId,
      enneagramType: req.params.type,
      text: fields.text,
      img: fields.img,
    };

    const query = `mutation CreateContent($id: String, $userId: String!, $enneagramType: String!, $text: String, $img: String) {
        createContent(id: $id, userId: $userId, enneagramType: $enneagramType, text: $text, img: $img) {
            id
            author {
              id
            }
            text
            img
            likes
            dateCreated
            comments{
              comments{
                id
                comment
                likes
                dateCreated
                author {
                  id
                  enneagramId
                }
                comments {
                  comments {
                    id
                  }
                  count
                }
              }
              count
            }
        }
      }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.createContent);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function getContent(req: Request, res: Response) {
  try {
    const variables = {
      enneagramType: req.params.type,
      type: req.body.type ? req.body.type : "",
      pageSize: req.body.pageSize ? req.body.pageSize : 10,
      lastDate: req.params.lastDate ? req.params.lastDate : "",
    };

    const query = `query GetContent($enneagramType: String!, $type: String, $pageSize: Int, $lastDate: String!) {
        getContent(enneagramType: $enneagramType, type: $type, pageSize: $pageSize, lastDate: $lastDate) {
          content {
            id
            author {
              id
            }
            text
            img
            likes
            dateCreated
            comments {
              comments {
                id
                comment
                likes
                dateCreated
                author {
                  id
                  enneagramId
                }
                comments {
                  comments {
                    id
                  }
                  count
                }
              }
              count
            }
          }
          count
        }
      }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getContent);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function loadMore(req: Request, res: Response) {
  try {
    const variables = {
      lastDate: req.params.lastDate ? req.params.lastDate : "",
      parentId: req.params.parentId ? req.params.parentId : "",
    };

    const query = `query GetMoreComments($parentId: String!, $lastDate: String!) {
      getMoreComments(parentId: $parentId, lastDate: $lastDate) {
        comments {
          id
          comment
          likes
          dateCreated
          parentId
          author {
            id
            enneagramId
          }
          comments {
            comments {
              id
            }
            count
          }
        }
        count
      }
    }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getMoreComments);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function parseForm(req): Promise<any> {
  try {
    if (req["file"] || req["files"]) {
      console.log("contains file");
    } else {
      console.log("no file");
    }
    const form = new formidable.IncomingForm();
    return await new Promise((resolve, reject) => {
      return form.parse(req, async (err, fields, files) => {
        if (err) {
          return new Error("Error parsing form");
        }
        const obj = {};
        Object.keys(fields).forEach((key) => {
          obj[key] = fields[key];
        });

        let imgKey = "";
        if (files.img) {
          imgKey = await getImage(files.img);
          obj["img"] = imgKey;
        }
        resolve(obj);
      });
    });
  } catch (error) {
    console.log(error);
    return null;
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
    await client.update({
      index: req.params.enneaType,
      id: req.params.contentId,
      body: {
        script: {
          source: `${
            req.params.operation === "add"
              ? "ctx._source.likes++"
              : "ctx._source.likes--"
          }`,
        },
      },
    });
    const variables = {
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
