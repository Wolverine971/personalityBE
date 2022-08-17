import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";

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
    const resp = await pingGraphql({query, variables, req});
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

    if (req.headers.authorization && req.headers.authorization !== "null") {
      if (req.headers.authorization.includes(process.env.RANDO_PREFIX)) {
        rando = req.headers.authorization;
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
    const resp = await pingGraphql({query, variables, req});
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

        const variables = {
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
        const gqlResp = await pingGraphql({query, variables, req});
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

    const variables = {
      uid: req.params.rando,
    };

    const query = `query GetQuestions($pageSize: Int, $lastDate: String!) {
        getQuestions(pageSize: $pageSize, lastDate: $lastDate) {
          questions {
            id
            question
            likes
            context
            img
            url
            subscribers
            commenterIds
            dateCreated
            comments {
              comments {
                id
              }
              count
            }
            author {
              id
              enneagramId
            }
            modified
          }
          count
        }
      }`;
    const resp = await pingGraphql({query, variables, req});
    if (!resp.errors) {
      res.json(resp.data.getQuestions);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};
