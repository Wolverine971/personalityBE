import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
import { parseForm } from "../Content/content.controller";

// tslint:disable: no-string-literal
export async function createBlog(req: Request, res: Response) {
  try {
    const fields = await parseForm(req);
    let id = null;

    const esResp = await client.index({
      index: "blog",
      type: "_doc",
      body: {
        authorId: req["payload"].userId,
        text: fields.body,
        comments: 0,
        likes: 0,
        createdDate: new Date(),
      },
    });
    id = esResp._id;

    const variables = {
      id,
      title: fields.title,
      description: fields.description,
      body: fields.body,
      authorId: req["payload"].userId,
      size: parseInt(fields.size, 10),
      img: fields.img,
      imgText: fields.imgText,
    };

    const query = `mutation CreateBlog($id: String!, 
              $title: String!, 
              $img: String,
              $imgText: String,
              $description: String!, 
              $body: String!, 
              $authorId: String!, 
              $size: Int ) {
                createBlog(id: $id, 
                  title: $title,
                  img: $img,
                  imgText: $imgText, 
                  description: $description, 
                  body: $body, 
                  authorId: $authorId, 
                  size: $size) {
            id
          }
        }`;
    const resp = await pingGraphql({query, variables, req});
    if (!resp.errors) {
      res.json(resp.data.createBlog);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function updateBlog(req: Request, res: Response) {
  try {
    const fields = await parseForm(req);
    const variables = {
      id: req.params.id,
      title: fields.title,
      description: fields.description,
      body: fields.body,
      authorId: req["payload"].userId,
      size: parseInt(fields.size, 10),
      img: fields.img,
      imgText: fields.imgText
    };

    const query = `mutation UpdateBlog($id: String!, 
                  $title: String, 
                  $img: String,
                  $imgText: String,
                  $description: String, 
                  $body: String, 
                  $authorId: String!, 
                  $size: Int ) {
          updateBlog(id: $id, 
            title: $title, 
            img: $img,
            imgText: $imgText, 
            description: $description, 
            body: $body, 
            authorId: $authorId, 
            size: $size) {
              id
            }
          }`;
    const resp = await pingGraphql({query, variables, req});
    if (!resp.errors) {
      res.json(resp.data.updateBlog);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function addBlogLike(req: Request, res: Response) {
  try {
    await client.update({
      index: "blog",
      id: req.params.blogId,
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
      id: req.params.blogId,
      type: "blog",
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

export async function deleteBlog(req: Request, res: Response) {
  try {
    const variables = {
      id: req.params.id,
    };

    const query = `mutation DeleteBlog($id: String! ) {
          deleteBlog(id: $id)
          }`;
    const resp = await pingGraphql({query, variables, req});
    if (!resp.errors) {
      res.json(resp.data.deleteBlog);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function getBlogs(req: Request, res: Response) {
  try {
    const variables = {
      lastDate: req.params.lastDate ? req.params.lastDate : "",
    };

    const query = `query GetBlogs($lastDate: String! ) {
        getBlogs(lastDate: $lastDate){
            blog {
                id
                author {
                    id
                    firstName
                    lastName
                    enneagramId
                }
                title
                description
                img
                imgText
                size
                likes
                comments{
                    count
                }
                dateCreated
                dateModified
            }
            count

        }
            }`;
    const resp = await pingGraphql({query, variables, req});
    if (!resp.errors) {
      res.json(resp.data.getBlogs);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}

export async function getBlog(req: Request, res: Response) {
  try {
    const variables = {
      title: req.params.title,
    };

    const query = `query GetBlog($title: String!) {
        getBlog(title: $title){
            id
            author {
                id
                firstName
                lastName
                enneagramId
            }
            title
            description
            body
            img
            imgText
            size
            likes
            comments{
                comments{
                    id
                }
                count
            }
            dateCreated
            dateModified
        }
            }`;
    const resp = await pingGraphql({query, variables, req});
    if (!resp.errors) {
      res.json(resp.data.getBlog);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
}
