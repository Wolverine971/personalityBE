import { Router } from "express";

import Auth from "./routes/Auth/auth.route";
import blog from "./routes/Blog/blog.route";
import comment from "./routes/Comment/comment.route";
import content from "./routes/Content/content.route";
import dashboard from "./routes/Dashboard/dashboard.route";
import question from "./routes/Question/question.route";
import rando from "./routes/rando/rando.route";
import relationship from "./routes/Relationship/relationship.route";
import email from "./routes/Emails/email.route";

const router: Router = Router();

router.use("/user", Auth);
router.use("/question", question);
router.use("/comment", comment);
router.use("/content", content);
router.use("/dashboard", dashboard);
router.use("/relationship", relationship);
router.use("/rando", rando);
router.use("/blog", blog);

router.use("/email", email);

router.get("/", (req, res) => {
  res.send("<h1>yup</h1>");
});

export default router;
