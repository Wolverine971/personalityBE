import { Router } from "express";
import { isAuth } from "../Auth/auth.controller";
import * as commentController from "./comment.controller";

const router: Router = Router();

router.post("/add/:index/:id/:enneaType?", commentController.addComment);
router.post("/update/:id", commentController.updateComment);
router.get("/:commentId", commentController.getComment);
router.get("/like/:commentId/:operation/:enneaType?", isAuth,
  commentController.addCommentLike
);

export default router;
