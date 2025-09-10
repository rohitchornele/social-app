import express from "express";
import {
	createComment,
	deleteComment,
	getCommentReplies,
	getPostComments,
} from "../controllers/commentController.js";
import { authenticateToken, optionalAuth } from "../middlewares/auth.js";
import {
	commentIdValidator,
	createCommentValidator,
} from "../validators/commentValidator.js";

const router = express.Router();

router.post(
	"/post/:postId",
	createCommentValidator,
	authenticateToken,
	createComment,
);
router.get("/post/:postId", optionalAuth, getPostComments);
router.get(
	"/:commentId/replies",
	commentIdValidator,
	optionalAuth,
	getCommentReplies,
);
router.delete(
	"/:commentId",
	commentIdValidator,
	authenticateToken,
	deleteComment,
);

export default router;
