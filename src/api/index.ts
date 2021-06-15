import { Router } from "express";

import Auth from "./routes/Auth/auth.route";
import blog from "./routes/Blog/blog.route";
import comment from "./routes/Comment/comment.route";
import content from "./routes/Content/content.route";
import dashboard from "./routes/Dashboard/dashboard.route";
import question from "./routes/Question/question.route";
import relationship from "./routes/Relationship/relationship.route";

const router: Router = Router();

router.use("/user", Auth);
router.use("/question", question);
router.use("/comment", comment);
router.use("/content", content);
router.use("/dashboard", dashboard);
router.use("/relationship", relationship);
router.use("/blog", blog);

router.get("/", (req, res) => {
  res.send("<h1>yup</h1>");
});

export default router;
