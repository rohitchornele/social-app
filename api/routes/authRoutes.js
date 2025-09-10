import express from "express";
import {
	getProfile,
	login,
	logout,
	refreshToken,
	register,
} from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/auth.js";
import {
	loginValidator,
	registerValidator,
} from "../validators/authValidator.js";

const router = express.Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateToken, logout);
router.get("/profile", authenticateToken, getProfile);

export default router;
