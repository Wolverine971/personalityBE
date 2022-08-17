import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as questionsController from "./question.controller";

const router: Router = Router();
// router.get("/update", questionsController.update);
// router.get("/update", questionsController.updateUsers)
router.get("/typeAhead/:question", questionsController.getTypeAhead);
router.post("/add", isAuth, questionsController.addQuestion);
router.get(
  "/all/:pageSize/:lastDate?",
  questionsController.getQuestions
);
router.post("/update/:questionId", isAuth, questionsController.updateQuestion)
router.get("/one/:url", questionsController.getQuestion);
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
router.post("/sort/:questionUrl?", questionsController.getComments);

router.put("/notifications", isAuth, questionsController.clearNotifications);

router.post("/getUrl", isAuth, questionsController.getUrl);
router.post("/reIndex", questionsController.reIndex);
router.post("/updateGraphQL", questionsController.updateGraphQL);
router.get('/all', questionsController.all)
// updateGraphQL
export default router;
