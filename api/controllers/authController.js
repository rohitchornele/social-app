import { validationResult } from "express-validator";
import { generateTokens, verifyRefreshToken } from "../config/jwt.js";
import User from "../models/User.js";

export const register = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const { username, email, password } = req.body;

		// Check if user already exists
		const existingUser = await User.findOne({
			$or: [{ email }, { username }],
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				message:
					existingUser.email === email
						? "Email already registered"
						: "Username already taken",
			});
		}

		// Create new user
		const user = new User({ username, email, password });
		await user.save();

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user._id);

		// Save refresh token to user
		user.refreshToken = refreshToken;
		await user.save();

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			data: {
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
					profilePicture: user.profilePicture,
					bio: user.bio,
				},
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const login = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const { emailOrUsername, password } = req.body;

		// Find user by email or username
		const user = await User.findOne({
			$or: [{ email: emailOrUsername }, { username: emailOrUsername }],
		}).select("+password");

		if (!user || !user.isActive) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		// Check password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user._id);

		// Update refresh token
		user.refreshToken = refreshToken;
		await user.save();

		res.json({
			success: true,
			message: "Login successful",
			data: {
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
					profilePicture: user.profilePicture,
					bio: user.bio,
				},
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const refreshToken = async (req, res, next) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(401).json({
				success: false,
				message: "Refresh token is required",
			});
		}

		const decoded = verifyRefreshToken(refreshToken);
		const user = await User.findById(decoded.userId).select("+refreshToken");

		if (!user || user.refreshToken !== refreshToken) {
			return res.status(401).json({
				success: false,
				message: "Invalid refresh token",
			});
		}

		// Generate new tokens
		const tokens = generateTokens(user._id);
		user.refreshToken = tokens.refreshToken;
		await user.save();

		res.json({
			success: true,
			data: tokens,
		});
	} catch (error) {
		res.status(401).json({
			success: false,
			message: "Invalid refresh token",
		});
	}
};

export const logout = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id);
		user.refreshToken = null;
		await user.save();

		res.json({
			success: true,
			message: "Logged out successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const getProfile = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id)
			.populate("followers", "username profilePicture")
			.populate("following", "username profilePicture");

		res.json({
			success: true,
			data: { user },
		});
	} catch (error) {
		next(error);
	}
};
