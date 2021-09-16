import { Router } from "express";

import { isAuth } from "../Auth/auth.controller";
import * as blogController from "./blog.controller";

const router: Router = Router();

router.post("/create", isAuth, blogController.createBlog);
router.post("/update/:id", isAuth, blogController.updateBlog);
router.delete("/delete/:id", isAuth, blogController.deleteBlog);

router.get("/get/:lastDate?", blogController.getBlogs);
router.get("/getOne/:title", blogController.getBlog);


export default router;
