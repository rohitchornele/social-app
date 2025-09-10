import Notification from "../models/Notifications.js";

export const getNotifications = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 20;
		const skip = (page - 1) * limit;

		const notifications = await Notification.find({
			recipient: req.user._id,
		})
			.populate("sender", "username profilePicture")
			.populate("relatedPost", "imageUrl")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const unreadCount = await Notification.countDocuments({
			recipient: req.user._id,
			isRead: false,
		});

		const totalNotifications = await Notification.countDocuments({
			recipient: req.user._id,
		});

		res.json({
			success: true,
			data: {
				notifications,
				unreadCount,
				pagination: {
					currentPage: page,
					totalPages: Math.ceil(totalNotifications / limit),
					hasMore: skip + notifications.length < totalNotifications,
				},
			},
		});
	} catch (error) {
		next(error);
	}
};

export const markAsRead = async (req, res, next) => {
	try {
		const { notificationId } = req.params;

		const notification = await Notification.findOneAndUpdate(
			{
				_id: notificationId,
				recipient: req.user._id,
			},
			{ isRead: true },
			{ new: true },
		);

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "Notification not found",
			});
		}

		res.json({
			success: true,
			message: "Notification marked as read",
		});
	} catch (error) {
		next(error);
	}
};

export const markAllAsRead = async (req, res, next) => {
	try {
		await Notification.updateMany(
			{
				recipient: req.user._id,
				isRead: false,
			},
			{ isRead: true },
		);

		res.json({
			success: true,
			message: "All notifications marked as read",
		});
	} catch (error) {
		next(error);
	}
};

export const deleteNotification = async (req, res, next) => {
	try {
		const { notificationId } = req.params;

		const notification = await Notification.findOneAndDelete({
			_id: notificationId,
			recipient: req.user._id,
		});

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "Notification not found",
			});
		}

		res.json({
			success: true,
			message: "Notification deleted",
		});
	} catch (error) {
		next(error);
	}
};

export const getUnreadCount = async (req, res, next) => {
	try {
		const unreadCount = await Notification.countDocuments({
			recipient: req.user._id,
			isRead: false,
		});

		res.json({
			success: true,
			data: { unreadCount },
		});
	} catch (error) {
		next(error);
	}
};
