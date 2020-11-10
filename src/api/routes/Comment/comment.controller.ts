import { Request, Response } from "express";
import { pingGraphql } from "../../../helpers/pingGraphql";

// tslint:disable-next-line: no-var-requires
import { client } from "../../elasticsearch";

export async function addLike(req: Request, res: Response) {
  try {
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
            authorId
            comments {
              id
              comment
              authorId
              likes
              comments {
                id
              }
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
      },
    })
    .then(async (resp) => {
      if (req.params.index === "question") {
        const date = new Date();
        await client.update({
          index: "question",
          id: req.params.id,
          type: "_doc",
          body: {
            doc: {
              updatedDate: date,
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
          authorId
          comments {
            id
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

export async function addCommentLike(req: Request, res: Response) {
  try {
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

// export async function getMoreComments(req: Request, res: Response) {
//   try {
//     const variables = {
//       commentId: req.params.commentId,
//     };

//     const query = `query GetQuestion($questionId: String!) {
//         getQuestion(questionId: $questionId) {
//           id
//           question
//           likes
//           subscribers
//           authorId
//           comments {
//             comment
//             authorId
//             likes
//             comments {
//               id
//             }
//           }
//         }
//       }`;
//     const resp = await pingGraphql(query, variables);
//     if (!resp.errors) {
//       res.json(resp.data.getQuestion);
//     } else {
//       res.status(400).send(resp.errors);
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error.message);
//   }
// }
