import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
import { parseAuthToken } from "../Auth/auth.controller";

// tslint:disable: no-string-literal
export const getRando = async (req: Request, res: Response) => {
  try {
    const variables = {
      id: req.params.rando,
    };

    const query = `query GetRando($id: String!) {
        getRando(id: $id) {
          id
            questions 
              
            
          }
        }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp.data.getRando);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};

export const getPermissions = async (req: Request, res: Response) => {
  try {
    let rando = "";
    const token = parseAuthToken(req.headers.authorization);

    if (token !== "null") {
      if (token.includes(process.env.RANDO_PREFIX)) {
        rando = token;
      }
    }
    const variables = {
      id: rando,
    };

    const query = `query GetRando($id: String!) {
        getRando(id: $id) {
            id
            questions
          }
        }`;
    const gqlResp = await pingGraphql({ query, variables, req });
    if (!gqlResp.errors) {
      res.json(gqlResp.data.getRando);
    } else {
      res.status(400).send(gqlResp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};

export const addRando = async (req: Request, res: Response) => {
  try {
    const randoId = `${process.env.RANDO_PREFIX}${req.params.rando}`;

    const date = new Date();
    return client
      .index({
        index: "comment",
        type: "_doc",
        body: {
          parentId: req.params.id,
          authorId: req["payload"].userId,
          comment: req.body.comment,
          comments: 0,
          likes: 0,
          createdDate: date,
        },
      })
      .then(async (resp) => {
        if (req.params.index === "question") {
          await client.update({
            index: "question",
            id: req.params.id,
            type: "_doc",
            body: {
              script: {
                source: "ctx._source.comments++",
              },
            },
          });
        } else if (req.params.index === "comment") {
          await client.update({
            index: "comment",
            id: req.params.id,
            type: "_doc",
            body: {
              script: {
                source: "ctx._source.comments++",
              },
            },
          });
        } else if (req.params.index === "relationship") {
          await client.update({
            index: "relationship",
            id: req.params.id,
            type: "_doc",
            body: {
              script: {
                source: "ctx._source.comments++",
              },
            },
          });
        } else if (req.params.index === "blog") {
          await client.update({
            index: "blog",
            id: req.params.id,
            type: "_doc",
            body: {
              script: {
                source: "ctx._source.comments++",
              },
            },
          });
        }

        const cVariables = {
          id: resp._id,
          parentId: req.params.id,
          authorId: req["payload"].userId,
          comment: req.body.comment,
          type: req.params.index,
        };

        const query = `mutation AddComment($id: String!, $parentId: String, $authorId: String!, $comment: String!, $type: String!) {
        addComment(id: $id, parentId: $parentId, authorId: $authorId, comment: $comment, type: $type ) {
          id
          comment
          likes
          dateCreated
          author {
            email
            enneagramId
          }
          comments {
            comments {
              id
            }
            count
          }
        }
      }`;
        const gqlResp = await pingGraphql({
          query,
          variables: cVariables,
          req,
        });
        if (!gqlResp.errors) {
          res.json(gqlResp.data.addComment);
        } else {
          res.status(400).send(gqlResp.errors);
        }
      })
      .catch((err) => {
        console.trace(err.message);
        res.status(400).send(err.message);
      });
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};
