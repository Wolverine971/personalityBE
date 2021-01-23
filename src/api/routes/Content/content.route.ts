import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as contentController from "./content.controller";

const router: Router = Router();

router.post("/:type", isAuth, contentController.addContent);
router.get("/all/:type/:lastDate?", contentController.getContent);
router.get(
  "/like/:contentId/:operation/:enneaType",
  isAuth,
  contentController.addContentLike
);
router.get("/loadMore/:parentId/:lastDate", contentController.loadMore);

export default router;
