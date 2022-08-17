import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as randoController from "./rando.controller";

const router: Router = Router();
// router.get("/update", questionsController.update);
// router.get("/update", questionsController.updateUsers)
router.get('/', randoController.getPermissions )
router.get("/user/:rando", randoController.getRando);
router.post("/add/:rando", randoController.addRando);

// router.post("/claim/:rando", isAuth, randoController.claimRando);

export default router;