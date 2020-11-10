import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
// tslint:disable-next-line: no-var-requires
import { client } from "../../elasticsearch";
import { typeaheadQuery } from "../../ESRequests";

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

    const query = `query GetDashboard($userId: String!) {
        getDashboard(userId: $userId) {
            id
            question
            likes
            subscribers
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
    const variables = {
      // tslint:disable-next-line: no-string-literal
      userId: req["payload"].userId,
    };

    const gqlResp = await pingGraphql(query, variables);
    if (!gqlResp.errors) {
      console.log(gqlResp.data);
      res.json({ subscriptions: gqlResp.data.getDashboard, newQuestions });
    } else {
      res.status(400).send(gqlResp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}
