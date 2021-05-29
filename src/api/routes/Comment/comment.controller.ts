import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
// tslint:disable-next-line: no-var-requires
import { client } from "../../elasticsearch";

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
              id
              enneagramId
            }
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
        }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getComment);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function addComment(req: Request, res: Response) {
  const date = new Date();
  return client
    .index({
      index: "comment",
      // id: '1',
      type: "_doc",
      body: {
        parentId: req.params.id,
        // tslint:disable-next-line: no-string-literal
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
      }
      else if (req.params.index === "relationship") {
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
        // tslint:disable-next-line: no-string-literal
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
      const gqlResp = await pingGraphql(query, variables);
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
}
export async function updateComment(req: Request, res: Response) {
  const date = new Date();

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

  const variables = {
    commentId: req.params.id,
    comment: req.body.comment,
  };

  const query = `mutation UpdateComment($commentId: String!, $comment: String) {
        updateComment(commentId: $commentId, comment: $comment) 
      }`;
  const gqlResp = await pingGraphql(query, variables);
  if (!gqlResp.errors) {
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
          source: `${req.params.operation === 'add' ? 'ctx._source.likes++' : 'ctx._source.likes--'}`,
        },
      },
    });
    const variables = {
      // tslint:disable-next-line: no-string-literal
      userId: req["payload"].userId,
      id: req.params.commentId,
      type: "comment",
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
