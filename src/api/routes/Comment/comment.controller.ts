import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
// tslint:disable: no-string-literal
export async function getComment(req: Request, res: Response) {
  try {
    const variables = {
      commentId: req.params.commentId,
    };

    const query = `query GetComment($commentId: String!) {
          getComment(commentId: $commentId) {
            id
            comment
            likes
            dateCreated
            author {
              __typename
              ... on User{
                id
                enneagramId
              }
              ... on Rando {
                id
              }
              
            }
            comments {
              comments {
                id
                comment
                likes
                dateCreated
                author {
                  __typename
                  ... on User{
                    id
                    enneagramId
                  }
                  ... on Rando {
                    id
                  }
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
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp.data.getComment);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
}

export async function addComment(req: Request, res: Response) {
  try {
    const date = new Date();
    let authorId;
    let rando = false;
    if (req.headers.authorization && req.headers.authorization !== "null") {
      if (req.headers.authorization.includes(process.env.RANDO_PREFIX)) {
        authorId = req.headers.authorization;
        rando = true;
      } else {
        const payload: any = verify(
          req.headers.authorization,
          process.env.ACCESS_TOKEN
        );
        authorId = payload.userId;
      }

    }

    if (authorId) {
      return client
        .index({
          index: "comment",
          type: "_doc",
          body: {
            parentId: req.params.id,
            authorId: authorId,
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
          } else {
            await client.update({
              index: req.params.enneaType,
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
            authorId: authorId,
            comment: req.body.comment,
            type: req.params.index,
            ip: req.ip,
          };

          const query = `mutation AddComment($id: String!, $parentId: String, $authorId: String!, $comment: String!, $type: String!, $ip: String!) {
        addComment(id: $id, parentId: $parentId, authorId: $authorId, comment: $comment, type: $type, ip: $ip ) {
          id
          comment
          likes
          dateCreated
          author {
            __typename
            ${
              rando
                ? `... on Rando {
              id
            }`
                : `... on User{
              id
              email
              enneagramId
            }`
            }
          }
          comments {
            comments {
              id
            }
            count
          }
        }
      }`;
          const gqlResp = await pingGraphql({ query, variables, req });
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
    } else {
      res.status(400).send('no author');
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
}
export async function updateComment(req: Request, res: Response) {
  const date = new Date();

  let authorId;
  if (req.headers.authorization && req.headers.authorization !== "null") {
    if (req.headers.authorization.includes(process.env.RANDO_PREFIX)) {
      authorId = req.headers.authorization;
    } else {
      const payload: any = verify(
        req.headers.authorization,
        process.env.ACCESS_TOKEN
      );
      authorId = payload.userId;
    }
  }

  const variables = {
    commentId: req.params.id,
    comment: req.body.comment,
    authorId: authorId,
  };

  const query = `mutation UpdateComment($commentId: String!, $comment: String, $authorId: String!) {
        updateComment(commentId: $commentId, comment: $comment, authorId: $authorId) 
      }`;
  const gqlResp = await pingGraphql({ query, variables, req });
  if (!gqlResp.errors) {
    await client.update({
      index: "comment",
      id: req.params.id,
      type: "_doc",
      body: {
        script: {
          source: `ctx._source.comment = '${req.body.comment}'`,
        },
      },
    });
    res.json(gqlResp.data.updateComment);
  } else {
    res.status(400).send(gqlResp.errors);
  }
}

export async function addCommentLike(req: Request, res: Response) {
  try {
    await client.update({
      index: "comment",
      id: req.params.commentId,
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
      id: req.params.commentId,
      type: "comment",
      operation: req.params.operation,
    };

    const query = `mutation AddLike($userId: String!, $id: String!, $type: String!, $operation: String!) {
          addLike(userId: $userId, id: $id, type: $type, operation: $operation)
        }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      res.json(resp);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
}
