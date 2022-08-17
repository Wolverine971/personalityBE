// import fetch from "node-fetch";
import { Request } from "express";
const axios = require('axios').default;

export const pingGraphql = async ({
  query,
  variables,
  req,
}: {
  query: any;
  variables?: any;
  req: Request;
}) => {
  try {

    // const body = variables && query ? JSON.stringify({
    //   variables,
    //   query,
    // }) : JSON.stringify({
    //   query,
    // })
    // const response = await fetch("http://localhost:3002/graphql", {
    //   method: "post",
    //   body,
    //   headers: { ...req.headers },
    // });
    // const data = await response.body
    // return data


    const response = await axios({
      method: 'post',
      url: 'http://localhost:3002/graphql',
      data: {
        variables,
      query,
      },
      headers: req?.headers?.authorization ? { Authorization: req?.headers?.authorization }: {},
    });

    return response.data
  } catch (e) {
    console.log(e);
    return e;
  }
};
