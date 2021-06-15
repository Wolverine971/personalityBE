import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as blogController from "./blog.controller";

const router: Router = Router();

router.post("/create", isAuth, blogController.createBlog);
router.post("/update/:id", isAuth, blogController.updateBlog);
router.delete("/delete/:id", isAuth, blogController.deleteBlog);

router.get("/get/:lastDate?", isAuth, blogController.getBlogs);


export default router;
