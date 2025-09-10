import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE || "7d",
	});

	const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
		expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
	});

	return { accessToken, refreshToken };
};

export const verifyToken = (token) => {
	return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
	return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
