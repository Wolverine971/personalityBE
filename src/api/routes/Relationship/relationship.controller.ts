import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";

export async function getRelationship(req: Request, res: Response) {
  try {
    const variables = {
      id1: req.params.id1,
      id2: req.params.id2,
      pageSize: parseInt(req.params.pageSize, 10),
    };
    const query = `query getRelationshipData($id1: String!, $id2: String!, $pageSize: Int) {
        getRelationshipData(id1: $id1, id2: $id2, pageSize: $pageSize) {
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
