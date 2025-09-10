import { body, param } from "express-validator";

export const createCommentValidator = [
	body("text")
		.notEmpty()
		.withMessage("Comment text is required")
		.isLength({ min: 1, max: 500 })
		.withMessage("Comment must be between 1 and 500 characters")
		.trim(),

	body("parentCommentId")
		.optional()
		.isMongoId()
		.withMessage("Invalid parent comment ID"),

	param("postId").isMongoId().withMessage("Invalid post ID"),
];

export const commentIdValidator = [
	param("commentId").isMongoId().withMessage("Invalid comment ID"),
];
