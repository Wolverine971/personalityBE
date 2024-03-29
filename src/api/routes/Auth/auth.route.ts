import { Router } from "express";

import * as controller from "./auth.controller";

const router: Router = Router();
router.get("/getAll", controller.isAuth, controller.getAll);
router.get("/all/:lastDate?", controller.isAuth, controller.getPaginatedUsers);

router.get("/getUserById", controller.isAuth, controller.getUserById);
router.post("/addOne", controller.isAuth, controller.addOne);
router.put("/updateOne", controller.isAuth, controller.updateOne);

router.delete(
  "/deleteOneByEmail",
  controller.isAuth,
  controller.deleteOneByEmail
);

router.post("/login", controller.login);
// router.get("/user", controller.isAuth, controller.getUser)
router.get("/confirm/:confirmationToken", controller.confirmUser);
router.post("/logout", controller.logout);
router.post("/register", controller.register);
router.post("/forgotPassword", controller.forgotPassword);
router.get("/refresh_token/:token", controller.doRefreshToken);

router.post("/refresh_token_auth/", controller.authDoRefreshToken);

router.post("/revoke_refresh", controller.revokeRefreshTokens);
router.get("/leave", controller.isAuth, controller.leave);
router.get("/enter", controller.isAuth, controller.enter);

router.get("/user", controller.getUser);

router.get("/reset/:token", controller.reset);
router.post("/resetPassword/:token", controller.resetPassword);

router.get("/sendEmail/:password", controller.sendAllUsers);
router.post("/change", controller.isAuth, controller.change);

export default router;
