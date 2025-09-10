import express from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  getUserPosts,
  getPostComments, // Add this
  getPostLikes,    // Add this
} from '../controllers/postController.js';
import { authenticateToken, optionalAuth } from '../middlewares/auth.js';
import { uploadSingle, handleMulterError } from '../middlewares/upload.js';
import { createPostValidator, postIdValidator } from '../validators/postValidator.js';

const router = express.Router();

// Create post
router.post('/', authenticateToken, uploadSingle, handleMulterError, createPostValidator, createPost);

// Get all posts (feed)
router.get('/', optionalAuth, getAllPosts);

// Get user's posts
router.get('/user/:userId', getUserPosts);

// Get post by ID with comments
router.get('/:postId', postIdValidator, optionalAuth, getPostById);

// Get post comments
router.get('/:postId/comments', postIdValidator, optionalAuth, getPostComments);

// Get post likes
router.get('/:postId/likes', postIdValidator, optionalAuth, getPostLikes);

// Delete post
router.delete('/:postId', postIdValidator, authenticateToken, deletePost);

export default router;
