import { Router } from "express";

import * as controller from "./auth.controller";

const router: Router = Router();

router.get("/getAll", controller.isAuth, controller.getAll);

router.get("/getUser", controller.isAuth, controller.getUser);
router.post("/addOne", controller.isAuth, controller.addOne);
router.put("/updateOne", controller.isAuth, controller.updateOne);

router.delete(
  "/deleteOneByEmail",
  controller.isAuth,
  controller.deleteOneByEmail
);

router.post("/login", controller.login);
router.get("/logout", controller.isAuth, controller.logout);
router.post("/register", controller.register);
router.post("/forgotPassword", controller.forgotPassword);
router.get("/refresh_token/:token", controller.doRefreshToken);

router.post("/revoke_refresh", controller.revokeRefreshTokens);

export default router;
