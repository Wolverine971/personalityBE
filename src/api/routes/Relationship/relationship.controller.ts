import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";

export async function getRelationship(req: Request, res: Response) {
  try {
    const variables = {
      id1: req.params.id1,
      id2: req.params.id2,
      lastDate: req.params.lastDate || "",
      pageSize: parseInt(req.params.pageSize, 10),
    };
    const query = `query getRelationshipData($id1: String!, $id2: String!, $pageSize: Int, $lastDate: String!) {
        getRelationshipData(id1: $id1, id2: $id2, pageSize: $pageSize, lastDate: $lastDate) {
            RelationshipData {
                id
                author {
                    id
                    enneagramId
                }
                text
                likes
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
                dateCreated
                dateModified
            }
            count
        }
      }`;
    const gqlResp = await pingGraphql(query, variables);
    if (!gqlResp.errors) {
      res.json(gqlResp.data.getRelationshipData);
    } else {
      res.status(400).send(gqlResp.errors);
    }
  } catch (e) {
    console.log(e);
  }
}

export async function createRelationshipData(req: Request, res: Response) {
  try {
    const date = new Date();
    return client
      .index({
        index: "relationship",
        // id: '1',
        type: "_doc",
        body: {
          // tslint:disable-next-line: no-string-literal
          authorId: req["payload"].userId,
          text: req.body.text,
          comments: 0,
          likes: 0,
          createdDate: date,
        },
      })
      .then(async (resp) => {
        console.log(resp);
        const variables = {
          id: resp._id,
          // tslint:disable-next-line: no-string-literal
          userId: req["payload"].userId,
          relationship: [req.params.id1, req.params.id2],
          text: req.body.text
        };

        const query = `mutation CreateRelationshipData($id: String, $userId: String, $relationship: [String], $text: String) {
              createRelationshipData(id: $id, userId: $userId, relationship: $relationship, text: $text) {
                id
                author {
                    id
                    enneagramId
                }
                text
                likes
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
                dateCreated
                dateModified
                  
              }
            }`;
        const gqlResp = await pingGraphql(query, variables);
        if (!gqlResp.errors) {
          res.json(gqlResp.data.createRelationshipData);
        } else {
          res.status(400).send(gqlResp.errors);
        }
      });
  } catch (e) {
    console.log(e);
  }
}

export async function addRelationshipDataLike(req: Request, res: Response) {
  try {
    await client.update({
      index: "relationship",
      id: req.params.id,
      body: {
        script: {
          source: "ctx._source.likes++",
        },
      },
    });

    const variables = {
      // tslint:disable-next-line: no-string-literal
      userId: req["payload"].userId,
      id: req.params.id,
      type: "relationship",
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

export async function updateRelationship(req: Request, res: Response) {
  const date = new Date();

  await client.update({
    index: "relationship",
    id: req.params.id,
    type: "_doc",
    body: {
      script: {
        source: `ctx._source.text = '${req.body.text}'`,
      },
    },
  });

  const variables = {
    threadId: req.params.id,
    text: req.body.text,
  };

  const query = `mutation UpdateThread($threadId: String!, $text: String) {
        updateThread(threadId: $threadId, text: $text) 
      }`;
  const gqlResp = await pingGraphql(query, variables);
  if (!gqlResp.errors) {
    res.json(gqlResp.data.updateThread);
  } else {
    res.status(400).send(gqlResp.errors);
  }
}