import { Router } from "express";

import Auth from "./routes/Auth/auth.route";
import comment from "./routes/Comment/comment.route";
import content from "./routes/Content/content.route";
import dashboard from "./routes/Dashboard/dashboard.route";
import question from "./routes/Question/question.route";

const router: Router = Router();

router.use("/user", Auth);
router.use("/question", question);
router.use("/comment", comment);
router.use("/content", content);
router.use("/dashboard", dashboard);

router.get("/", (req, res) => {
  res.send("<h1>Scraper API Up</h1>");
});

export default router;
