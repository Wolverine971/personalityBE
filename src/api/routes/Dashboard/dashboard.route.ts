import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as dashboardController from "./dashboard.controller";

const router: Router = Router();

router.get("", isAuth, dashboardController.getDashboard);


export default router;
