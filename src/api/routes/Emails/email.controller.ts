import { Request, Response } from "express";
import { pingGraphql } from "../../../helpers/pingGraphql";
import { sendEmail } from "../Auth/auth.controller";
import { join } from "../Auth/emailTemplates";
// tslint:disable: no-string-literal
export async function addEmail(req: Request, res: Response) {
  try {
    const variables = {
      email: req.body.email,
    };

    const query = `mutation AddEmail($email: String) {
          addEmail(email: $email) 
        }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      console.log(resp);
      res.json(resp.data.addEmail);
      const sent: any = await sendEmail(
        req.body.email,
        "Welcome to the Waitlist for 9takes",
        join()
      );
      if (sent) {
        console.log("Join Email sent");
      } else {
        console.log("Join Email fail");
      }
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
}

export async function getEmails(req: Request, res: Response) {
  try {
    const variables = {
      lastDate: req.params.date,
    };

    const query = `query getEmails($lastDate: String) {
          getEmails(lastDate: $lastDate) {
            emails {
               email
               id
               dateCreated
            }
            count 
          }
        }`;
    const resp = await pingGraphql({ query, variables, req });
    if (!resp.errors) {
      console.log(resp);
      res.json(resp.data.getEmails);
    } else {
      res.status(400).send(resp.errors);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message);
  }
}
