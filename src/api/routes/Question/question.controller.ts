import { Request, Response } from "express";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
import { typeaheadQuery } from "../../ESRequests";

export async function getTypeAhead(req: Request, res: Response) {
  console.log(req.query.index);
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
  console.log(req.params.question);
  const date = new Date();
  console.log(date);
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
      console.log("Successful query!");

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
          authorId
          subscribers
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

export async function getAllPaginated(req: Request, res: Response) {
  try {
    const variables = {
      // tslint:disable-next-line: radix
      pageSize: parseInt(req.params.pageSize),
      cursorId: req.params.cursorId || "",
    };

    const query = `query GetPaginatedQuestions($pageSize: Int, $cursorId: String!) {
      getPaginatedQuestions(pageSize: $pageSize, cursorId: $cursorId) {
        questions {
          id
          authorId
          question
          likes
          subscribers
        }
        count
      }
    }`;
    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getPaginatedQuestions);
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
          authorId
          comments {
            id
            comment
            authorId
            likes
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
    console.log(req.params.questionId);
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
