import { validationResult } from "express-validator";
import Comment from "../models/Comments.js";
import Notification from "../models/Notifications.js";
import Post from "../models/Post.js";
import { sendNotificationEmail } from "../services/emailService.js";

export const createComment = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const { postId } = req.params;
		const { text, parentCommentId } = req.body;
		const userId = req.user._id;

		// Verify post exists
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

		// If replying to a comment, verify parent comment exists
		let parentComment = null;
		if (parentCommentId) {
			parentComment = await Comment.findOne({
				_id: parentCommentId,
				post: postId,
				isActive: true,
			}).populate("user", "username email");

			if (!parentComment) {
				return res.status(404).json({
					success: false,
					message: "Parent comment not found",
				});
			}
		}

		// Create comment
		const comment = new Comment({
			post: postId,
			user: userId,
			text: text.trim(),
			parentComment: parentCommentId || null,
		});

		await comment.save();
		await comment.populate("user", "username profilePicture");

		// Update post comment count
		post.commentCount = await Comment.countDocuments({
			post: postId,
			isActive: true,
		});
		await post.save();

		// Add to parent comment replies if it's a reply
		if (parentComment) {
			parentComment.replies.push(comment._id);
			await parentComment.save();
		}

		// Create notification for post owner (if not commenting on own post)
		if (post.user._id.toString() !== userId.toString()) {
			const notification = new Notification({
				recipient: post.user._id,
				sender: userId,
				type: "comment",
				message: parentComment
					? `${req.user.username} replied to your comment`
					: `${req.user.username} commented on your post`,
				relatedPost: postId,
				relatedComment: comment._id,
			});

			await notification.save();

			// Send email notification
			try {
				await sendNotificationEmail(post.user, "comment", {
					senderName: req.user.username,
					commentText: text.trim(),
				});
				notification.isEmailSent = true;
				await notification.save();
			} catch (emailError) {
				console.error("Failed to send email notification:", emailError);
			}
		}

		// If replying to someone else's comment, notify the comment author
		if (
			parentComment &&
			parentComment.user._id.toString() !== userId.toString()
		) {
			const replyNotification = new Notification({
				recipient: parentComment.user._id,
				sender: userId,
				type: "comment",
				message: `${req.user.username} replied to your comment`,
				relatedPost: postId,
				relatedComment: comment._id,
			});

			await replyNotification.save();
		}

		res.status(201).json({
			success: true,
			message: "Comment created successfully",
			data: { comment },
		});
	} catch (error) {
		next(error);
	}
};

export const getPostComments = async (req, res, next) => {
	try {
		const { postId } = req.params;
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const skip = (page - 1) * limit;

		// Get top-level comments (no parent)
		const comments = await Comment.find({
			post: postId,
			isActive: true,
			parentComment: null,
		})
			.populate("user", "username profilePicture")
			.populate({
				path: "replies",
				populate: {
					path: "user",
					select: "username profilePicture",
				},
				match: { isActive: true },
				options: { limit: 3, sort: { createdAt: 1 } }, // Show first 3 replies
			})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const totalComments = await Comment.countDocuments({
			post: postId,
			isActive: true,
			parentComment: null,
		});

		// Add user's like status if authenticated
		const commentsWithUserInfo = comments.map((comment) => {
			const commentObj = comment.toObject();
			if (req.user) {
				commentObj.isLikedByUser = comment.likes.some(
					(like) => like.user.toString() === req.user._id.toString(),
				);

				// Add like status for replies too
				commentObj.replies = commentObj.replies.map((reply) => {
					reply.isLikedByUser = reply.likes.some(
						(like) => like.user.toString() === req.user._id.toString(),
					);
					return reply;
				});
			}
			return commentObj;
		});

		res.json({
			success: true,
			data: {
				comments: commentsWithUserInfo,
				pagination: {
					currentPage: page,
					totalPages: Math.ceil(totalComments / limit),
					totalComments,
					hasMore: skip + comments.length < totalComments,
				},
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getCommentReplies = async (req, res, next) => {
	try {
		const { commentId } = req.params;
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const skip = (page - 1) * limit;

		const replies = await Comment.find({
			parentComment: commentId,
			isActive: true,
		})
			.populate("user", "username profilePicture")
			.sort({ createdAt: 1 })
			.skip(skip)
			.limit(limit);

		const totalReplies = await Comment.countDocuments({
			parentComment: commentId,
			isActive: true,
		});

		// Add user's like status if authenticated
		const repliesWithUserInfo = replies.map((reply) => {
			const replyObj = reply.toObject();
			if (req.user) {
				replyObj.isLikedByUser = reply.likes.some(
					(like) => like.user.toString() === req.user._id.toString(),
				);
			}
			return replyObj;
		});

		res.json({
			success: true,
			data: {
				replies: repliesWithUserInfo,
				hasMore: skip + replies.length < totalReplies,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const deleteComment = async (req, res, next) => {
	try {
		const { commentId } = req.params;

		const comment = await Comment.findOne({
			_id: commentId,
			user: req.user._id,
			isActive: true,
		});

		if (!comment) {
			return res.status(404).json({
				success: false,
				message:
					"Comment not found or you are not authorized to delete this comment",
			});
		}

		// Soft delete comment and its replies
		comment.isActive = false;
		await comment.save();

		await Comment.updateMany({ parentComment: commentId }, { isActive: false });

		// Update post comment count
		const post = await Post.findById(comment.post);
		if (post) {
			post.commentCount = await Comment.countDocuments({
				post: comment.post,
				isActive: true,
			});
			await post.save();
		}

		// Delete related notifications
		await Notification.deleteMany({
			relatedComment: commentId,
		});

		res.json({
			success: true,
			message: "Comment deleted successfully",
		});
	} catch (error) {
		next(error);
	}
};
