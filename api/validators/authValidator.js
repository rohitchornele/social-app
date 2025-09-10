import { body } from "express-validator";

export const registerValidator = [
	body("username")
		.isLength({ min: 3, max: 20 })
		.withMessage("Username must be between 3 and 20 characters")
		.matches(/^[a-zA-Z0-9_]+$/)
		.withMessage("Username can only contain letters, numbers, and underscores"),

	body("email")
		.isEmail()
		.withMessage("Please provide a valid email")
		.normalizeEmail(),

	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters long")
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage(
			"Password must contain at least one uppercase letter, one lowercase letter, and one number",
		),
];

export const loginValidator = [
	body("emailOrUsername")
		.notEmpty()
		.withMessage("Email or username is required"),

	body("password").notEmpty().withMessage("Password is required"),
];
