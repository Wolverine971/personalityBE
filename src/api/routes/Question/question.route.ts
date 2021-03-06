import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as questionsController from "./question.controller";

const router: Router = Router();
// router.get("/update", questionsController.update);
// router.get("/update", questionsController.updateUsers)
router.get("/typeAhead/:question", questionsController.getTypeAhead);
router.get("/add/:question/:type", isAuth, questionsController.addQuestion);
router.get(
  "/all/:pageSize/:lastDate?",
  questionsController.getQuestions
);
router.post("/update/:questionId", isAuth, questionsController.updateQuestion)
router.get("/:question", isAuth, questionsController.getQuestion);
router.get("/single/:question", questionsController.getJustQuestion);
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
router.post("/sort/:questionId?", isAuth, questionsController.getComments);

router.put("/notifications", isAuth, questionsController.clearNotifications);


export default router;
