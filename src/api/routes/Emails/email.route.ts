import { Router } from "express";
// import { isAuth } from "../Auth/auth.controller";
import * as emailController from "./email.controller";

const router: Router = Router();

router.post("/add", emailController.addEmail);

router.get("/:date?", emailController.getEmails);

export default router;
