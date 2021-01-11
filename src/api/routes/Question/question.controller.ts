import { Request, Response } from "express";

import { redis } from "../../..";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
import { typeaheadQuery } from "../../ESRequests";

export async function getTypeAhead(req: Request, res: Response) {
  const comment = req.params.comment;
  return client
    .search(typeaheadQuery("question", comment))
    .then((resp) => {
      res.json(resp.hits.hits);
    })
    .catch((err) => {
      console.trace(err.message);
      res.status(400).send(err.message);
    });
}

export async function addQuestion(req: Request, res: Response) {
  const date = new Date();
  return client
    .index({
      index: "question",
      type: "_doc",
      body: {
        question: req.params.question,
        // tslint:disable-next-line: no-string-literal
        authorId: req["payload"].userId,
        createdDate: date,
        updatedDate: date,
      },
    })
    .then(async (resp) => {
      const variables = {
        id: resp._id,
        question: req.params.question,
        // tslint:disable-next-line: no-string-literal
        authorId: req["payload"].userId,
      };

      const query = `mutation CreateQuestion($id: String!, $question: String!, $authorId: String!) {
        createQuestion(id: $id, question: $question, authorId: $authorId) {
          id
          question
          likes
          author {
            id
            enneagramId
          }
          subscribers
          dateCreated
          comments {
            id
          }
        }
      }`;
      const gqlResp = await pingGraphql(query, variables);
      if (!gqlResp.errors) {
        res.json(gqlResp.data.createQuestion);
      } else {
        res.status(400).send(gqlResp.errors);
      }
    })
    .catch((err) => {
      console.trace(err.message);
      res.status(400).send(err.message);
    });
}

export async function getQuestions(req: Request, res: Response) {
  try {
    const variables = {
      // tslint:disable-next-line: radix
      pageSize: parseInt(req.params.pageSize),
      lastDate: req.params.lastDate || "",
    };

    const query = `query GetQuestions($pageSize: Int, $lastDate: String!) {
      getQuestions(pageSize: $pageSize, lastDate: $lastDate) {
        questions {
          id
          author {
            id
            enneagramId
          }
          question
          likes
          subscribers
          dateCreated
        }
        count
      }
    }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getQuestions);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function addQuestionLike(req: Request, res: Response) {
  try {
    const variables = {
      // tslint:disable-next-line: no-string-literal
      userId: req["payload"].userId,
      id: req.params.questionId,
      type: "question",
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

export async function getQuestion(req: Request, res: Response) {
  try {
    const variables = {
      questionId: req.params.question,
    };

    const query = `query GetQuestion($questionId: String!) {
        getQuestion(questionId: $questionId) {
          id
          question
          likes
          subscribers
          commentorIds
          author {
            id
            enneagramId
          }
          dateCreated
          comments {
            id
            comment
            author {
              id
              enneagramId
            }
            likes
            comments {
              id
            }
          }
        }
      }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getQuestion);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function getJustQuestion(req: Request, res: Response) {
  try {
    const variables = {
      questionId: req.params.question,
    };

    const query = `query GetQuestion($questionId: String!) {
        getQuestion(questionId: $questionId) {
          id
          question
          likes
          subscribers
          commentorIds
          dateCreated
        }
      }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getQuestion);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function addSubscription(req: Request, res: Response) {
  try {
    const variables = {
      questionId: req.params.questionId,
      // tslint:disable-next-line: no-string-literal
      userId: req["payload"].userId,
      operation: req.params.operation,
    };

    const query = `mutation AddSubscription($userId: String!, $questionId: String!, $operation: String!) {
        addSubscription(userId: $userId, questionId: $questionId, operation: $operation) 
      }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.addSubscription);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function getComments(req: Request, res: Response) {
  try {
    const variables = {
      questionId: req.params.questionId,
      enneagramTypes: req.body.enneagramTypes,
      dateRange: req.body.dateRange,
      sortBy: req.body.sortBy,
    };

    const query = `query getComments($questionId: String!, $enneagramTypes: [String], $dateRange: String, $sortBy: String) {
        getComments(questionId: $questionId, enneagramTypes: $enneagramTypes, dateRange: $dateRange, sortBy: $sortBy) {
          id
          comment
          likes
          dateCreated
          author {
            id
            enneagramId
          }
          comments {
            id
            comment
            author {
              id
              enneagramId
            }
            likes
            comments {
              id
            }
          }
        }
      }`;

    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getComments);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}


export async function clearNotifications(req: Request, res: Response) {
  try {
    const redisClient = redis.createClient();
    // tslint:disable-next-line: no-string-literal
    redisClient.set(`push:notifications:${req["payload"].userId}`, '');
    res.status(200).send('ok')
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}