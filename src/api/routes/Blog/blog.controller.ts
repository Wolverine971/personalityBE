import { Request, Response } from "express";

import { pingGraphql } from "../../../helpers/pingGraphql";
import { client } from "../../elasticsearch";

// tslint:disable: no-string-literal
export async function createBlog(req: Request, res: Response) {
  try {
    const variables = {
      title: req.body.title,
      description: req.body.description,
      body: req.body.body,
      author: req.body.author,
      img: req.body.img,
    };

    const query = `mutation CreateBlog($title: String!, $img: String, $description: String!, $body: String!, $author: String! ) {
        createBlog(title: $title, img: $img, description: $description, body: $body, author: $author) {
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
      author: req.body.author,
      img: req.body.img,
    };

    const query = `mutation UpdateBlog($title: String!, $img: String, $description: String!, $body: String!, $author: String! ) {
          updateBlog(title: $title, img: $img, description: $description, body: $body, author: $author) {
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
                title
                description
                body
                img
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