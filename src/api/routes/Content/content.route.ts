import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as contentController from "./content.controller";

const router: Router = Router();

router.post("/:type", isAuth, contentController.addContent);
router.get("/all/:type", isAuth, contentController.getContent);
// router.get("/:commentId", isAuth, contentController.getComment);

export default router;
