import { validationResult } from "express-validator";
import Comment from "../models/Comments.js";
import Notification from "../models/Notifications.js";
import Post from "../models/Post.js";
import {
	deleteImageFromCloudinary,
	uploadImageToCloudinary,
} from "../services/uploadService.js";

export const createPost = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "Image is required",
			});
		}

		const { caption = "" } = req.body;

		// Upload image to Cloudinary
		const uploadResult = await uploadImageToCloudinary(
			req.file.buffer,
			"community-app/posts",
		);

		// Create post
		const post = new Post({
			user: req.user._id,
			imageUrl: uploadResult.secure_url,
			imagePublicId: uploadResult.public_id,
			caption: caption.trim(),
			isActive: true ,
		});

		console.log('Creating post for user:', req.user._id);

		await post.save();
		await post.populate("user", "username profilePicture");

		console.log('Post created successfully:', post._id);

		res.status(201).json({
			success: true,
			message: "Post created successfully",
			data: { post },
		});
	} catch (error) {
		next(error);
	}
};

export const getAllPosts = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const posts = await Post.find({ isActive: true })
			.populate("user", "username profilePicture")
			.populate({
				path: "likes.user",
				select: "username",
			})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		// Add user's like status if authenticated
		const postsWithUserInfo = posts.map((post) => {
			const postObj = post.toObject();
			if (req.user) {
				postObj.isLikedByUser = post.likes.some(
					(like) => like.user._id.toString() === req.user._id.toString(),
				);
			}
			return postObj;
		});

		const totalPosts = await Post.countDocuments({ isActive: true });
		const totalPages = Math.ceil(totalPosts / limit);

		res.json({
			success: true,
			data: {
				posts: postsWithUserInfo,
				pagination: {
					currentPage: page,
					totalPages,
					totalPosts,
					hasNext: page < totalPages,
					hasPrev: page > 1,
				},
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getPostById = async (req, res, next) => {
	try {
		const { postId } = req.params;

		const post = await Post.findOne({ _id: postId, isActive: true })
			.populate("user", "username profilePicture bio")
			.populate({
				path: "likes.user",
				select: "username profilePicture",
			});

		if (!post) {
			return res.status(404).json({
				success: false,
				message: "Post not found",
			});
		}

		// Get comments for this post
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
			})
			.sort({ createdAt: -1 });

		const postObj = post.toObject();
		if (req.user) {
			postObj.isLikedByUser = post.likes.some(
				(like) => like.user._id.toString() === req.user._id.toString(),
			);
		}

		res.json({
			success: true,
			data: {
				post: postObj,
				comments,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const deletePost = async (req, res, next) => {
	try {
		const { postId } = req.params;

		const post = await Post.findOne({
			_id: postId,
			user: req.user._id,
			isActive: true,
		});

		if (!post) {
			return res.status(404).json({
				success: false,
				message: "Post not found or you are not authorized to delete this post",
			});
		}

		// Delete image from Cloudinary
		await deleteImageFromCloudinary(post.imagePublicId);

		// Soft delete post
		post.isActive = false;
		await post.save();

		// Delete related comments and notifications
		await Comment.updateMany({ post: postId }, { isActive: false });

		await Notification.deleteMany({
			relatedPost: postId,
		});

		res.json({
			success: true,
			message: "Post deleted successfully",
		});
	} catch (error) {
		next(error);
	}
};

export const getUserPosts = async (req, res, next) => {
	try {
		const { userId } = req.params;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 12;
		const skip = (page - 1) * limit;

		const posts = await Post.find({
			user: userId,
			isActive: true,
		})
			.populate("user", "username profilePicture")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const totalPosts = await Post.countDocuments({
			user: userId,
			isActive: true,
		});

		res.json({
			success: true,
			data: {
				posts,
				totalPosts,
				hasMore: skip + posts.length < totalPosts,
			},
		});
	} catch (error) {
		next(error);
	}
};


// Add these methods to your existing postController.js

export const getPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify post exists
    const post = await Post.findOne({ _id: postId, isActive: true });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get top-level comments
    const comments = await Comment.find({
      post: postId,
      isActive: true,
      parentComment: null
    })
      .populate('user', 'username profilePicture')
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'username profilePicture'
        },
        match: { isActive: true },
        options: { limit: 3, sort: { createdAt: 1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalComments = await Comment.countDocuments({
      post: postId,
      isActive: true,
      parentComment: null
    });

    // Add user's like status if authenticated
    const commentsWithUserInfo = comments.map(comment => {
      const commentObj = comment.toObject();
      if (req.user) {
        commentObj.isLikedByUser = comment.likes.some(like => 
          like.user.toString() === req.user._id.toString()
        );
        
        // Add like status for replies
        commentObj.replies = commentObj.replies.map(reply => {
          reply.isLikedByUser = reply.likes.some(like => 
            like.user.toString() === req.user._id.toString()
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
          hasMore: skip + comments.length < totalComments
        }
      }
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

    const post = await Post.findOne({ _id: postId, isActive: true })
      .populate({
        path: 'likes.user',
        select: 'username profilePicture'
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likes = post.likes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        likes,
        totalLikes: post.likeCount,
        hasMore: skip + likes.length < post.likeCount,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(post.likeCount / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

