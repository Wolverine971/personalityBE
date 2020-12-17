import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as questionsController from "./question.controller";

const router: Router = Router();

router.get("/typeAhead/:comment", isAuth, questionsController.getTypeAhead);
router.get("/add/:question", isAuth, questionsController.addQuestion);
router.get(
  "/all/:pageSize/:cursorId?",
  isAuth,
  questionsController.getQuestions
);

router.get("/:question", isAuth, questionsController.getQuestion);
router.get(
  "/like/:questionId/:operation",
  isAuth,
  questionsController.addQuestionLike
);
router.get(
  "/subscribe/:questionId/:operation",
  isAuth,
  questionsController.addSubscription
);

router.post("/sort/:questionId", isAuth, questionsController.getComments);

export default router;
