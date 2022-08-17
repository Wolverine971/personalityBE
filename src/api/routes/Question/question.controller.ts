import { Request, Response } from "express";

import { redis } from "../../..";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
import { typeaheadQuery } from "../../ESRequests";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../../..";
const { removeStopwords } = require("stopword");


export const all = async (req: Request, res: Response) => {
  try {
    const query = `query Questions {
      questions {
          url
      }
    }`;
    const resp = await pingGraphql({query, variables: null, req});
    if (!resp.errors) {
      console.log(resp.data)
      res.json(resp.data.questions);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

// tslint:disable: no-string-literal
export async function getTypeAhead(req: Request, res: Response) {
  const question = req.params.question;
  return client
    .search(typeaheadQuery("question", "question", question, 10))
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
        question: req.body.question,
        authorId: req["payload"].userId,
        authorType: req.body.type,
        url: req.body.url,
        comments: 0,
        likes: 0,
        subscriptions: 0,
        createdDate: date,
        updatedDate: date,
      },
    })
    .then(async (resp) => {
      const Key = uuidv4();
      try {
        const buf = Buffer.from(
          req.body.img.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
        const data = {
          Bucket: process.env.S3_BUCKET as string,
          Key,
          Body: buf,
          ContentEncoding: "base64",
          ContentType: "image/jpeg",
          ACL: "public-read",
        };
        await s3.putObject(data).promise();
      } catch (error) {
        console.log(error);
      }

      const variables = {
        id: resp._id,
        question: req.body.question,
        context: req.body.context,
        img: Key,
        authorId: req["payload"].userId,
        url: req.body.url,
      };

      const query = `mutation CreateQuestion($id: String!, $question: String!, $authorId: String!, $context: String, $img: String, $url: String ) {
        createQuestion(id: $id, question: $question, authorId: $authorId, context: $context, img: $img, url: $url) {
          id
          question
          likes
          context
          img
          url
          subscribers
          commenterIds
          dateCreated
          modified
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
      const gqlResp = await pingGraphql({query, variables, req});
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
          context
          img
          url
          subscribers
          commenterIds
          dateCreated
          comments {
            comments {
              id
            }
            count
          }
          author {
            id
            enneagramId
          }
          modified
        }
        count
      }
    }`;
    const resp = await pingGraphql({query, variables, req});
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
      id: req.params.questionId,
      type: "question",
      operation: req.params.operation,
    };

    const query = `mutation AddLike($userId: String!, $id: String!, $type: String!, $operation: String!) {
        addLike(userId: $userId, id: $id, type: $type, operation: $operation)
      }`;
    const resp = await pingGraphql({query, variables, req});
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
      questionUrl: req.params.url,
    };

    const query = `query GetQuestion($questionUrl: String!) {
        getQuestion(questionUrl: $questionUrl) {
          id
          question
          likes
          context
          img
          url
          subscribers
          commenterIds
          dateCreated
          modified
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
                __typename
    ... on User{
                  id
                  enneagramId
                }
                __typename
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
    const resp = await pingGraphql({query, variables, req});
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
      questionUrl: req.params.question,
    };

    const query = `query GetQuestion($questionUrl: String!) {
        getQuestion(questionUrl: $questionUrl) {
          author{
            id
          }
          id
          question
          comments {
            comments {
              id
            }
            count
          }
          likes
          context
          img
          url
          subscribers
          commenterIds
          dateCreated
          modified
        }
      }`;
    const resp = await pingGraphql({query, variables, req});
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
          source: `${
            req.params.operation === "add"
              ? "ctx._source.subscriptions++"
              : "ctx._source.subscriptions--"
          }`,
        },
      },
    });

    const variables = {
      questionId: req.params.questionId,
      userId: req["payload"].userId,
      operation: req.params.operation,
    };

    const query = `mutation AddSubscription($userId: String!, $questionId: String!, $operation: String!) {
        addSubscription(userId: $userId, questionId: $questionId, operation: $operation) 
      }`;
    const resp = await pingGraphql({query, variables, req});
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
      questionUrl: req.params.questionUrl ? req.params.questionUrl : null,
      enneagramTypes: req.body.enneagramTypes,
      dateRange: req.body.dateRange,
      sortBy: req.body.sortBy,
      skip: req.body.skip,
    };
    const query = `query GetSortedComments($questionUrl: String, $enneagramTypes: [String], $dateRange: String, $sortBy: String, $skip: Int) {
        getSortedComments(questionUrl: $questionUrl, enneagramTypes: $enneagramTypes, dateRange: $dateRange, sortBy: $sortBy, skip: $skip) {
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
              __typename
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
                  __typename
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
          count
        }
      }`;

    const resp = await pingGraphql({query, variables, req});
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
    redisClient.set(`push:notifications:${req["payload"].userId}`, "");
    res.status(200).send("ok");
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function updateQuestion(req: Request, res: Response) {
  try {
    const variables = {
      questionId: req.params.questionId,
      question: req.body.question,
      url: getUrlString(req.body.question),
    };

    const query = `mutation UpdateQuestion($questionId: String!, $question: String, $url: String) {
      updateQuestion(questionId: $questionId, question: $question, url: $url)
      }`;

    const resp = await pingGraphql({query, variables, req});
    if (!resp.errors) {
      res.json(resp.data.updateQuestion);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export const getUrl = async (req: Request, res: Response) => {
  try {
    const question = req.body.question;
    const tempUrl = getUrlString(question);
    const response = await client.search(
      typeaheadQuery("question", "url", tempUrl, 200)
    );

    if (response.hits.hits.length) {
      res.json({ url: `${tempUrl}-${response.hits.hits.length}` });
    } else {
      res.json({ url: tempUrl });
    }
    return;
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};

export const reIndex = async (req: Request, res: Response) => {
  try {
    if (process.env.reindex) {
      console.log("reindexing");
      const resp = await client.search({
        index: "question",
        size: 200,
      });
      const questions = resp.hits.hits.map((q) => {
        return {
          id: q._id,
          ...q._source,
        };
      });
      const dpromises = [];
      questions.forEach((q) => {
        dpromises.push(
          client.delete({
            id: q.id,
            index: "question",
            type: "_doc",
          })
        );
      });

      await Promise.all(dpromises);
      const cpromises = [];
      const newCreations = [];
      questions.forEach((q) => {
        const url = getUrlString(q.question);

        const body = {
          index: "question",
          type: "_doc",
          id: q.id,
          body: {
            context: "",
            url,
            question: q.question,
            authorId: q.authorId,
            authorType: q.authorType,
            comments: q.comments,
            likes: q.likes,
            subscriptions: q.subscriptions,
            createdDate: q.createdDate,
            updatedDate: q.updatedDate,
          },
        };
        cpromises.push(client.index(body));
        newCreations.push(body);
      });

      await Promise.all(cpromises);
      res.json({ questions, dpromises, cpromises, newCreations });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};

export const updateGraphQL = async (req: Request, res: Response) => {
  try {
    if (process.env.reindex) {
      console.log("updateGraphQL");
      const resp = await client.search({
        index: "question",
        size: 200,
      });
      const questions = resp.hits.hits.map((q) => {
        return {
          id: q._id,
          ...q._source,
        };
      });
      const dpromises = [];
      questions.forEach((q) => {
        const variables = {
          questionId: q.id,
          question: q.question,
          url: q.url,
        };

        const query = `mutation UpdateQuestion($questionId: String!, $question: String, $url: String) {
          updateQuestion(questionId: $questionId, question: $question, url: $url)
          }`;

        dpromises.push(pingGraphql({query, variables, req}));
      });

      await Promise.all(dpromises);
      res.json({ questions, dpromises });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};

const getUrlString = (unalteredText) => {
  const text = unalteredText.trim()
  let url = "";
  const leftOver = removeStopwords(text.split(" "));
  if (leftOver && leftOver.length && leftOver.length <= 3) {
    // if there is less than 3 key words keep the whole string up to the last key word
    const lastWord = leftOver[leftOver.length - 1];
    const index = text.indexOf(lastWord);
      url = text
      .substring(0, index + lastWord.length)
      .split(" ")
      .join("-")
      .toLowerCase();
  } else {
    url = leftOver.join("-").toLowerCase();
  }
  if(!url){
    return text.split(" ").join("-")
  }
  return url;
};

// export async function update(req: Request, res: Response) {
//   console.log("update questions");
//   try {
//     client
//       .search({
//         index: "question",
//         body: {
//           size: 100,
//         },
//       })
//       .then((resp) => {
//         const length = resp.hits.total.value;
//         resp.hits.hits.forEach(async (hit: IQuestionHit) => {
//           if (hit._source.likes === undefined) {
//             const respo = await client.update({
//               index: "question",
//               id: hit._id,
//               body: {
//                 script: {
//                   source:
//                     "ctx._source.comments = 0; ctx._source.likes = 0; ctx._source.subscriptions = 0;",
//                 },
//               },
//             });
//           }
//         });
//       })
//       .catch((err) => {
//         console.trace(err.message);
//         res.status(400).send(err.message);
//       });

//       client
//       .search({
//         index: "comment",
//         body: {
//           size: 320
//         },
//       })
//       .then((resp) => {
//         const length = resp.hits.total.value;
//         resp.hits.hits.forEach(async (hit: IQuestionHit) => {
//           if (hit._source.likes === undefined) {
//             const respo = await client.update({
//               index: "comment",
//               id: hit._id,
//               body: {
//                 script: {
//                   inline:
//                     "ctx._source.comments = 0; ctx._source.likes = 0;",
//                 },
//               },
//             });
//           }
//         });
//       })
//       .catch((err) => {
//         console.trace(err.message);
//         res.status(400).send(err.message);
//       });

//     ["1","2","3","4","5","6","7","8","9"].forEach(async (type) => {
//         client
//         .search({
//           index: type,
//           body: {
//             size: 320
//           },
//         })
//         .then((resp) => {
//           const length = resp.hits.total.value;
//           const d = new Date()
//           // "2021-01-15T19:13:27.664Z"
//           const formattedDate = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}T${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}Z`
//           resp.hits.hits.forEach(async (hit) => {
//             if (hit._source.text !== undefined && hit._source.likes === undefined) {
//               const respo = await client.update({
//                 index: type,
//                 id: hit._id,
//                 body: {
//                   script: {
//                     inline:
//                       `ctx._source.comments = 0; ctx._source.likes = 0; ctx._source.createdDate = '${formattedDate}';`,
//                   },
//                 },
//               });
//             }
//           });
//         })
//         .catch((err) => {
//           console.trace(err.message);
//           res.status(400).send(err.message);
//         });
//       })
//   } catch (error) {
//     console.log(error);
//     res.status(400).send(error.message);
//   }
// }

// export async function updateUsers(req: Request, res: Response) {

//   const query = `query ChangeField{
//     changeField
//   }`;
//   const resp = await pingGraphql({query});
//   if (!resp.errors) {
//     res.json(resp);
//   } else {
//     res.status(400).send(resp.errors);
//   }
// }
