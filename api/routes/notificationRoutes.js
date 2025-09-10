import express from "express";
import {
	deleteNotification,
	getNotifications,
	getUnreadCount,
	markAllAsRead,
	markAsRead,
} from "../controllers/notificationController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticateToken, getNotifications);
router.get("/unread-count", authenticateToken, getUnreadCount);
router.patch("/:notificationId/read", authenticateToken, markAsRead);
router.patch("/mark-all-read", authenticateToken, markAllAsRead);
router.delete("/:notificationId", authenticateToken, deleteNotification);

export default router;
