import { Request, Response } from "express";
import { pingGraphql } from "../../../helpers/pingGraphql";
// tslint:disable: no-string-literal
export async function addEmail(req: Request, res: Response) {
  try {
    const variables = {
      email: req.params.email,
    };

    const query = `mutation AddEmail($email: String) {
          addEmail(email: $email) 
        }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      console.log(resp);
      res.json(resp.data.addEmail);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
}
