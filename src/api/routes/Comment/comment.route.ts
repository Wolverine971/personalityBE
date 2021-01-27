import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as commentController from "./comment.controller";

const router: Router = Router();

router.post("/add/:index/:id/:enneaType?", isAuth, commentController.addComment);
router.get("/:commentId", isAuth, commentController.getComment);
router.get(
  "/like/:commentId/:operation/:enneaType?",
  isAuth,
  commentController.addCommentLike
);

export default router;
