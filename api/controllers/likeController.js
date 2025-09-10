import Comment from "../models/Comments.js";
import Notification from "../models/Notifications.js";
import Post from "../models/Post.js";
import { sendNotificationEmail } from "../services/emailService.js";

export const togglePostLike = async (req, res, next) => {
	try {
		const { postId } = req.params;
		const userId = req.user._id;

		const post = await Post.findOne({ _id: postId, isActive: true }).populate(
			"user",
			"username email",
		);

		if (!post) {
			return res.status(404).json({
				success: false,
				message: "Post not found",
			});
		}

		// Check if user already liked the post
		const existingLikeIndex = post.likes.findIndex(
			(like) => like.user.toString() === userId.toString(),
		);

		let isLiked = false;

		if (existingLikeIndex !== -1) {
			// Unlike the post
			post.likes.splice(existingLikeIndex, 1);

			// Remove notification
			await Notification.findOneAndDelete({
				recipient: post.user._id,
				sender: userId,
				type: "like",
				relatedPost: postId,
			});
		} else {
			// Like the post
			post.likes.push({ user: userId });
			isLiked = true;

			// Don't create notification if user likes their own post
			if (post.user._id.toString() !== userId.toString()) {
				// Create notification
				const notification = new Notification({
					recipient: post.user._id,
					sender: userId,
					type: "like",
					message: `${req.user.username} liked your post`,
					relatedPost: postId,
				});

				await notification.save();

				// Send email notification (async)
				try {
					await sendNotificationEmail(post.user, "like", {
						senderName: req.user.username,
					});
					notification.isEmailSent = true;
					await notification.save();
				} catch (emailError) {
					console.error("Failed to send email notification:", emailError);
				}
			}
		}

		await post.save();

		res.json({
			success: true,
			data: {
				isLiked,
				likeCount: post.likeCount,
				message: isLiked ? "Post liked" : "Post unliked",
			},
		});
	} catch (error) {
		next(error);
	}
};

export const toggleCommentLike = async (req, res, next) => {
	try {
		const { commentId } = req.params;
		const userId = req.user._id;

		const comment = await Comment.findOne({
			_id: commentId,
			isActive: true,
		}).populate("user", "username email");

		if (!comment) {
			return res.status(404).json({
				success: false,
				message: "Comment not found",
			});
		}

		const existingLikeIndex = comment.likes.findIndex(
			(like) => like.user.toString() === userId.toString(),
		);

		let isLiked = false;

		if (existingLikeIndex !== -1) {
			comment.likes.splice(existingLikeIndex, 1);
		} else {
			comment.likes.push({ user: userId });
			isLiked = true;
		}

		await comment.save();

		res.json({
			success: true,
			data: {
				isLiked,
				likeCount: comment.likeCount,
				message: isLiked ? "Comment liked" : "Comment unliked",
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getPostLikes = async (req, res, next) => {
	try {
		const { postId } = req.params;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;
		const skip = (page - 1) * limit;

		const post = await Post.findOne({ _id: postId, isActive: true }).populate({
			path: "likes.user",
			select: "username profilePicture",
			options: {
				skip,
				limit,
			},
		});

		if (!post) {
			return res.status(404).json({
				success: false,
				message: "Post not found",
			});
		}

		const likes = post.likes.slice(skip, skip + limit);

		res.json({
			success: true,
			data: {
				likes,
				totalLikes: post.likeCount,
				hasMore: skip + likes.length < post.likeCount,
			},
		});
	} catch (error) {
		next(error);
	}
};
