import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";
import { parseForm } from "../Content/content.controller";

// tslint:disable: no-string-literal
export async function createBlog(req: Request, res: Response) {
  try {
    const fields = await parseForm(req);
    let id = null;

    if (fields.text) {
      const esResp = await client.index({
        index: 'blog',
        type: "_doc",
        body: {
          authorId: req["payload"].userId,
          text: fields.text,
          comments: 0,
          likes: 0,
          createdDate: new Date(),
        },
      });
      id = esResp._id;
    }

    const variables = {
      title: fields.title,
      description: fields.description,
      body: fields.body,
      authorId: req["payload"].userId,
      size: parseInt(fields.size, 10),
      img: fields.img,
    };

    const query = `mutation CreateBlog($title: String!, $img: String, $description: String!, $body: String!, $authorId: String!, $size: Int ) {
        createBlog(title: $title, img: $img, description: $description, body: $body, authorId: $authorId, size: $size) {
            id
          }
        }`;
    const resp = await pingGraphql(query, variables);
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
    const variables = {
      id: req.params.id,
      title: req.body.title,
      description: req.body.description,
      body: req.body.body,
      authorId: req["payload"].userId,
      size: req.body.size,
      img: req.body.img,
    };

    const query = `mutation UpdateBlog($title: String!, $img: String, $description: String!, $body: String!, $authorId: String!, $size: Int ) {
          updateBlog(title: $title, img: $img, description: $description, body: $body, authorId: $authorId, size: $size) {
              id
            }
          }`;
    const resp = await pingGraphql(query, variables);
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

export async function deleteBlog(req: Request, res: Response) {
  try {
    const variables = {
      id: req.params.id,
    };

    const query = `mutation DeleteBlog($id: String! ) {
          deleteBlog(id: $id)
          }`;
    const resp = await pingGraphql(query, variables);
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
                preview
                img
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
    const resp = await pingGraphql(query, variables);
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
    const resp = await pingGraphql(query, variables);
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
