import express from 'express';
import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import likeRoutes from './likeRoutes.js';
import commentRoutes from './commentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import userRoutes from './userRoutes.js'; // Add this import

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/likes', likeRoutes);
router.use('/comments', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes); // Add this route

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
