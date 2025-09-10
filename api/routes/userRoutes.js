import express from 'express';
import {
  getUserById,
  updateProfile,
  uploadProfilePicture,
  getUserPosts,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  searchUsers,
  getFollowingFeed
} from '../controllers/userController.js';
import { authenticateToken, optionalAuth } from '../middlewares/auth.js';
import { uploadSingle, handleMulterError } from '../middlewares/upload.js';
import { updateProfileValidator, userIdValidator } from '../validators/userValidator.js';



const router = express.Router();

// Get following feed (posts from users you follow)
router.get('/feed/following', authenticateToken, getFollowingFeed);

// Search users
router.get('/search/:query', authenticateToken, searchUsers);

// Get user by ID
router.get('/:userId', userIdValidator, optionalAuth, getUserById);

// Update user profile
router.put('/profile', authenticateToken, updateProfileValidator, updateProfile);

// Upload profile picture
router.post('/profile/picture', authenticateToken, uploadSingle, handleMulterError, uploadProfilePicture);

// Get user's posts
router.get('/:userId/posts', userIdValidator, getUserPosts);

// Get user's followers
router.get('/:userId/followers', userIdValidator, getFollowers);

// Get user's following
router.get('/:userId/following', userIdValidator, getFollowing);

// Follow/Unfollow user
router.post('/:userId/follow', userIdValidator, authenticateToken, followUser);
router.delete('/:userId/follow', userIdValidator, authenticateToken, unfollowUser);



export default router;