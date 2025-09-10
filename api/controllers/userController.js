import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notifications.js';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../services/uploadService.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive information if not own profile
    const userObj = user.toObject();
    if (req.user && req.user._id.toString() !== userId) {
      // Add follow status for authenticated user
      userObj.isFollowing = user.followers.some(
        follower => follower._id.toString() === req.user._id.toString()
      );
    }

    res.json({
      success: true,
      data: { user: userObj }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, bio } = req.body;
    const userId = req.user._id;

    // Check if username is already taken (if changed)
    if (username !== req.user.username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        username: username.trim(),
        bio: bio.trim()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const publicId = user.profilePicture.split('/').pop().split('.')[0];
      try {
        await deleteImageFromCloudinary(`community-app/profiles/${publicId}`);
      } catch (error) {
        console.error('Failed to delete old profile picture:', error);
      }
    }

    // Upload new profile picture
    const uploadResult = await uploadImageToCloudinary(
      req.file.buffer, 
      'community-app/profiles'
    );

    // Update user profile
    user.profilePicture = uploadResult.secure_url;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { 
        user,
        profilePicture: uploadResult.secure_url
      }
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

    console.log('Fetching posts for userId:', userId);
    console.log('Current user:', req.user?._id);

    // Verify user exists
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const posts = await Post.find({
      user: userId,
      isActive: true
    })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${posts.length} posts for user ${userId}`);

    const totalPosts = await Post.countDocuments({
      user: userId,
      isActive: true
    });

    // Add user's like status if authenticated
    const postsWithUserInfo = posts.map(post => {
      const postObj = post.toObject();
      if (req.user) {
        postObj.isLikedByUser = post.likes.some(like => 
          like.user.toString() === req.user._id.toString()
        );
      }
      return postObj;
    });

    res.json({
      success: true,
      data: {
        posts: postsWithUserInfo,
        totalPosts,
        hasMore: skip + posts.length < totalPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          hasNext: skip + posts.length < totalPosts
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const followers = await User.find({
      _id: { $in: user.followers }
    })
      .select('username profilePicture bio followerCount followingCount')
      .skip(skip)
      .limit(limit);

    // ✅ CRITICAL FIX: Properly check if current user follows each follower
    const followersWithStatus = followers.map(follower => {
      const followerObj = follower.toObject();
      
      if (req.user) {
        // ✅ Check if the current authenticated user follows this follower
        followerObj.isFollowing = req.user.following.some(followedId => 
          followedId.toString() === follower._id.toString()
        );
        
        console.log(`Backend Followers: ${follower.username} - isFollowing: ${followerObj.isFollowing}`);
      } else {
        followerObj.isFollowing = false;
      }
      
      return followerObj;
    });

    const totalFollowers = user.followers.length;

    res.json({
      success: true,
      data: {
        followers: followersWithStatus, // ✅ Now includes correct isFollowing flags
        totalFollowers,
        hasMore: skip + followers.length < totalFollowers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalFollowers / limit),
          hasNext: skip + followers.length < totalFollowers
        }
      }
    });
  } catch (error) {
    console.error('getFollowers error:', error);
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const following = await User.find({
      _id: { $in: user.following }
    })
      .select('username profilePicture bio followerCount followingCount')
      .skip(skip)
      .limit(limit);

    // ✅ CRITICAL FIX: Always add isFollowing field
    const followingWithStatus = following.map(followedUser => {
      const followedObj = followedUser.toObject();
      
      if (req.user) {
        // ✅ For following list: if viewing own following, all should be true
        if (userId === req.user._id.toString()) {
          followedObj.isFollowing = true; // You follow ALL users in your following list
        } else {
          // If viewing someone else's following list, check if you follow them
          followedObj.isFollowing = req.user.following.some(followedId => 
            followedId.toString() === followedUser._id.toString()
          );
        }
        
        console.log(`Backend Following: ${followedUser.username} - isFollowing: ${followedObj.isFollowing}`);
      } else {
        followedObj.isFollowing = false;
      }
      
      return followedObj;
    });

    const totalFollowing = user.following.length;

    res.json({
      success: true,
      data: {
        following: followingWithStatus, // ✅ Now includes isFollowing field
        totalFollowing,
        hasMore: skip + following.length < totalFollowing,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalFollowing / limit),
          hasNext: skip + following.length < totalFollowing
        }
      }
    });
  } catch (error) {
    console.error('getFollowing error:', error);
    next(error);
  }
};


// export const followUser = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const currentUserId = req.user._id;

//     if (userId === currentUserId.toString()) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot follow yourself'
//       });
//     }

//     const userToFollow = await User.findById(userId);
//     const currentUser = await User.findById(currentUserId);

//     if (!userToFollow || !userToFollow.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Check if already following
//     const isAlreadyFollowing = currentUser.following.includes(userId);
//     if (isAlreadyFollowing) {
//       return res.status(400).json({
//         success: false,
//         message: 'You are already following this user'
//       });
//     }

//     // Add to following/followers
//     currentUser.following.push(userId);
//     userToFollow.followers.push(currentUserId);

//     await Promise.all([
//       currentUser.save(),
//       userToFollow.save()
//     ]);

//     // Create notification
//     const notification = new Notification({
//       recipient: userId,
//       sender: currentUserId,
//       type: 'follow',
//       message: `${req.user.username} started following you`
//     });

//     await notification.save();

//     res.json({
//       success: true,
//       message: 'User followed successfully',
//       data: {
//         isFollowing: true,
//         followerCount: userToFollow.followers.length
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const unfollowUser = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const currentUserId = req.user._id;

//     const userToUnfollow = await User.findById(userId);
//     const currentUser = await User.findById(currentUserId);

//     if (!userToUnfollow || !userToUnfollow.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Remove from following/followers
//     currentUser.following = currentUser.following.filter(
//       id => id.toString() !== userId
//     );
//     userToUnfollow.followers = userToUnfollow.followers.filter(
//       id => id.toString() !== currentUserId.toString()
//     );

//     await Promise.all([
//       currentUser.save(),
//       userToUnfollow.save()
//     ]);

//     // Remove follow notification
//     await Notification.findOneAndDelete({
//       recipient: userId,
//       sender: currentUserId,
//       type: 'follow'
//     });

//     res.json({
//       success: true,
//       message: 'User unfollowed successfully',
//       data: {
//         isFollowing: false,
//         followerCount: userToUnfollow.followers.length
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');

    // Search in username, email, and bio fields
    const users = await User.find({
      $and: [
        { isActive: true },
        { _id: { $ne: req.user._id } }, // Exclude current user from search
        {
          $or: [
            { username: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { bio: { $regex: searchRegex } }
          ]
        }
      ]
    })
      .select('username profilePicture bio followerCount followingCount')
      .sort({ followerCount: -1, username: 1 }) // Sort by popularity then name
      .skip(skip)
      .limit(limit);

    // Add follow status for authenticated user
    const usersWithFollowStatus = users.map(user => {
      const userObj = user.toObject();
      if (req.user) {
        userObj.isFollowing = req.user.following.includes(user._id);
      }
      return userObj;
    });

    const totalUsers = await User.countDocuments({
      $and: [
        { isActive: true },
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { bio: { $regex: searchRegex } }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        users: usersWithFollowStatus,
        totalUsers,
        hasMore: skip + users.length < totalUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          hasNext: skip + users.length < totalUsers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const [userToFollow, currentUser] = await Promise.all([
      User.findById(userId),
      User.findById(currentUserId)
    ]);

    if (!userToFollow || !userToFollow.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already following
    const isAlreadyFollowing = currentUser.following.includes(userId);
    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Update both users without transaction (simpler approach)
    await Promise.all([
      User.findByIdAndUpdate(
        currentUserId,
        { 
          $addToSet: { following: userId },
          $inc: { followingCount: 1 }
        }
      ),
      User.findByIdAndUpdate(
        userId,
        { 
          $addToSet: { followers: currentUserId },
          $inc: { followerCount: 1 }
        }
      )
    ]);

    // Create notification (separate operation)
    try {
      const notification = new Notification({
        recipient: userId,
        sender: currentUserId,
        type: 'follow',
        message: `${req.user.username} started following you`
      });
      await notification.save();
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the main operation for notification errors
    }

    // Check if this is a follow back
    const isFollowBack = userToFollow.following.includes(currentUserId);

    res.json({
      success: true,
      message: isFollowBack ? 'You are now following each other!' : 'User followed successfully',
      data: {
        isFollowing: true,
        isFollowBack,
        followerCount: userToFollow.followerCount + 1,
        followingCount: currentUser.followingCount + 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const [userToUnfollow, currentUser] = await Promise.all([
      User.findById(userId),
      User.findById(currentUserId)
    ]);

    if (!userToUnfollow || !userToUnfollow.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update both users without transaction
    await Promise.all([
      User.findByIdAndUpdate(
        currentUserId,
        { 
          $pull: { following: userId },
          $inc: { followingCount: -1 }
        }
      ),
      User.findByIdAndUpdate(
        userId,
        { 
          $pull: { followers: currentUserId },
          $inc: { followerCount: -1 }
        }
      )
    ]);

    // Remove notification (separate operation)
    try {
      await Notification.findOneAndDelete({
        recipient: userId,
        sender: currentUserId,
        type: 'follow'
      });
    } catch (notifError) {
      console.error('Failed to remove notification:', notifError);
    }

    res.json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        isFollowing: false,
        followerCount: Math.max(0, userToUnfollow.followerCount - 1),
        followingCount: Math.max(0, currentUser.followingCount - 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

// export const getFollowingFeed = async (req, res, next) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const userId = req.user._id;

//     // Get user's following list
//     const user = await User.findById(userId).select('following');
    
//     if (!user?.following || user.following.length === 0) {
//       return res.json({
//         success: true,
//         data: {
//           posts: [],
//           pagination: {
//             currentPage: page,
//             totalPages: 0,
//             totalPosts: 0,
//             hasNext: false
//           }
//         }
//       });
//     }

//     // Get posts from followed users only, sorted by upload time (newest first)
//     const posts = await Post.find({
//       user: { $in: user.following },
//       isActive: true
//     })
//       .populate('user', 'username profilePicture')
//       .populate({ path: 'likes.user', select: 'username' })
//       .sort({ createdAt: -1 }) // Sort by upload time, newest first
//       .skip(skip)
//       .limit(limit);

//     // Add user's like status
//     const postsWithUserInfo = posts.map(post => {
//       const postObj = post.toObject();
//       postObj.isLikedByUser = post.likes.some(like => 
//         like.user._id.toString() === userId.toString()
//       );
//       return postObj;
//     });

//     // Get total count for pagination
//     const totalPosts = await Post.countDocuments({
//       user: { $in: user.following },
//       isActive: true
//     });

//     const totalPages = Math.ceil(totalPosts / limit);

//     res.json({
//       success: true,
//       data: {
//         posts: postsWithUserInfo,
//         pagination: {
//           currentPage: page,
//           totalPages,
//           totalPosts,
//           hasNext: page < totalPages,
//           hasPrev: page > 1
//         }
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getFollowingFeed = async (req, res, next) => {
  try {
    console.log('🔍 Backend - Getting following feed for user:', req.user._id);
    
    // Get user's following list
    const user = await User.findById(req.user._id).select('following');
    console.log('👥 Backend - User following:', user?.following?.length || 0, 'users');
    console.log('📋 Backend - Following IDs:', user?.following);
    
    if (!user?.following || user.following.length === 0) {
      console.log('❌ Backend - No following users found');
      return res.json({
        success: true,
        data: {
          posts: [],
          pagination: { hasNext: false, totalPosts: 0 }
        }
      });
    }

    // Get posts from followed users
    const posts = await Post.find({
      user: { $in: user.following },
      isActive: true
    })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('📝 Backend - Found following posts:', posts.length);
    console.log('📝 Backend - Post user IDs:', posts.map(p => p.user._id));

    res.json({
      success: true,
      data: {
        posts,
        pagination: { hasNext: false, totalPosts: posts.length }
      }
    });
  } catch (error) {
    console.error('💥 Backend - Following feed error:', error);
    next(error);
  }
};

