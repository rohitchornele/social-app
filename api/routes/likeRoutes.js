import express from "express";
import {
	getPostLikes,
	toggleCommentLike,
	togglePostLike,
} from "../controllers/likeController.js";
import { authenticateToken } from "../middlewares/auth.js";
import { commentIdValidator } from "../validators/commentValidator.js";
import { postIdValidator } from "../validators/postValidator.js";

const router = express.Router();

router.post(
	"/post/:postId",
	postIdValidator,
	authenticateToken,
	togglePostLike,
);
router.post(
	"/comment/:commentId",
	commentIdValidator,
	authenticateToken,
	toggleCommentLike,
);
router.get("/post/:postId", postIdValidator, getPostLikes);

export default router;
