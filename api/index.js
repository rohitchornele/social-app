import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import connectDB from "./config/database.js";
import errorHandler from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
	}),
);

// CORS configuration
app.use(
	cors({
		origin: "*",
		credentials: true,
	}),
);

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500, // limit each IP to 100 requests per windowMs
	message: {
		success: false,
		message: "Too many requests from this IP, please try again later.",
	},
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Test route working ✅",
    timestamp: new Date(),
  });
});

app.use("/api", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
	res.json({
		success: true,
		message: "Community App API",
		version: "1.0.0",
		endpoints: {
			auth: "/api/auth",
			posts: "/api/posts",
			likes: "/api/likes",
			comments: "/api/comments",
			notifications: "/api/notifications",
		},
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
});


// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📱 API URL: http://localhost:${PORT}`);
	console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.error("Unhandled Promise Rejection:", err);
	process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	process.exit(1);
});
