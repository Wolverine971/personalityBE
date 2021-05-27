import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as questionsController from "./relationship.controller";

const router: Router = Router();
router.get("/:id1/:id2/:pageSize", isAuth, questionsController.getRelationship);
router.post("/create/:id1/:id2", isAuth, questionsController.createRelationshipData);



export default router;
