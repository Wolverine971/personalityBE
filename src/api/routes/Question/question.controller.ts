import { Request, Response } from "express";

import { redis } from "../../..";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
import { typeaheadQuery } from "../../ESRequests";
import { IQuestionHit } from "../../models/singleDoc";

export async function getTypeAhead(req: Request, res: Response) {
  const question = req.params.question;
  return client
    .search(typeaheadQuery("question", question))
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
        authorType: req.params.type,
        comments: 0,
        likes: 0,
        subscriptions: 0,
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
          subscribers
          commentorIds
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
          question
          likes
          subscribers
          commentorIds
          dateCreated
          author {
            id
            enneagramId
          }
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
    await client.update({
      index: "question",
      id: req.params.questionId,
      body: {
        script: {
          source: "ctx._source.likes++",
        },
      },
    });

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
    await client.update({
      index: "question",
      id: req.params.questionId,
      body: {
        script: {
          source: "ctx._source.subscription++",
        },
      },
    });

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

    const query = `query getSortedComments($questionId: String!, $enneagramTypes: [String], $dateRange: String, $sortBy: String) {
        getSortedComments(questionId: $questionId, enneagramTypes: $enneagramTypes, dateRange: $dateRange, sortBy: $sortBy) {
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
          count
        }
      }`;

    const resp = await pingGraphql(query, variables);
    if (!resp.errors) {
      res.json(resp.data.getSortedComments);
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
    redisClient.set(`push:notifications:${req["payload"].userId}`, "");
    res.status(200).send("ok");
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function update(req: Request, res: Response) {
  console.log("update questions");
  try {
    client
      .search({
        index: "question",
        body: {
          size: 100,
        },
      })
      .then((resp) => {
        const length = resp.hits.total.value;
        resp.hits.hits.forEach(async (hit: IQuestionHit) => {
          if (hit._source.likes === undefined) {
            const respo = await client.update({
              index: "question",
              id: hit._id,
              body: {
                script: {
                  source:
                    "ctx._source.comments = 0; ctx._source.likes = 0; ctx._source.subscriptions = 0;",
                },
              },
            });
          }
        });
      })
      .catch((err) => {
        console.trace(err.message);
        res.status(400).send(err.message);
      });

      client
      .search({
        index: "comment",
        body: {
          size: 320
        },
      })
      .then((resp) => {
        const length = resp.hits.total.value;
        resp.hits.hits.forEach(async (hit: IQuestionHit) => {
          if (hit._source.likes === undefined) {
            const respo = await client.update({
              index: "comment",
              id: hit._id,
              body: {
                script: {
                  inline:
                    "ctx._source.comments = 0; ctx._source.likes = 0;",
                },
              },
            });
          }
        });
      })
      .catch((err) => {
        console.trace(err.message);
        res.status(400).send(err.message);
      });


    ["1","2","3","4","5","6","7","8","9"].forEach(async (type) => {
        client
        .search({
          index: type,
          body: {
            size: 320
          },
        })
        .then((resp) => {
          const length = resp.hits.total.value;
          const d = new Date()
          // "2021-01-15T19:13:27.664Z"
          const formattedDate = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}T${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}Z`
          resp.hits.hits.forEach(async (hit) => {
            if (hit._source.text !== undefined && hit._source.likes === undefined) {
              const respo = await client.update({
                index: type,
                id: hit._id,
                body: {
                  script: {
                    inline:
                      `ctx._source.comments = 0; ctx._source.likes = 0; ctx._source.createdDate = '${formattedDate}';`,
                  },
                },
              });
            }
          });
        })
        .catch((err) => {
          console.trace(err.message);
          res.status(400).send(err.message);
        });
      })
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}
