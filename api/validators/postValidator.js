import { body, param } from "express-validator";

export const createPostValidator = [
	body("caption")
		.optional()
		.isLength({ max: 2200 })
		.withMessage("Caption cannot exceed 2200 characters")
		.trim(),
];

export const postIdValidator = [
	param("postId").isMongoId().withMessage("Invalid post ID"),
];
