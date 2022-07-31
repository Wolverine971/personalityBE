import { Request, Response } from "express";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
// tslint:disable: no-string-literal
export async function getDashboard(req: Request, res: Response) {
  try {
    const newQuestions = await client.search({
      index: "question",
      body: {
        size: 10,
        sort: [
          {
            createdDate: {
              order: "desc",
            },
          },
        ],
      },
    });

    const askedQuestions = await client.search({
      index: "question",
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  authorId: req["payload"].userId,
                },
              },
            ],
          },
        },

        size: 10,
        sort: [
          {
            createdDate: {
              order: "desc",
            },
          },
        ],
      },
    });

    const query = `query GetDashboard($userId: String!) {
        getDashboard(userId: $userId) {
            id
            question
            likes
            subscribers
            commenterIds
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
    const variables = {
      userId: req["payload"].userId,
    };

    const gqlResp = await pingGraphql(query, variables);
    if (!gqlResp.errors) {
      res.json({
        subscriptions: gqlResp.data.getDashboard,
        newQuestions: newQuestions.hits.hits.map(nq=>{
          return {
            id: nq._id,
            ...nq._source
          }
        }),
        askedQuestions: askedQuestions.hits.hits.map(nq=>{
          return {
            id: nq._id,
            ...nq._source
          }
        }),
      });
    } else {
      res.status(400).send(gqlResp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}
