import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateToken = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader?.split(" ")[1]; // Bearer TOKEN

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Access token is required",
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.userId);

		if (!user || !user.isActive) {
			return res.status(401).json({
				success: false,
				message: "Invalid token or user not found",
			});
		}

		req.user = user;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				success: false,
				message: "Token expired",
			});
		}

		return res.status(401).json({
			success: false,
			message: "Invalid token",
		});
	}
};

export const optionalAuth = async (req, res, next) => {
	try {
		const authHeader = req?.headers?.authorization;
		const token = authHeader?.split(" ")[1];

		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			const user = await User.findById(decoded.userId);
			if (user?.isActive) {
				req.user = user;
			}
		}
		console.log("auth responded");
		next();
	} catch (error) {
		// Continue without authentication
		console.log("Error in auth : ", error);
		next();
	}
};
