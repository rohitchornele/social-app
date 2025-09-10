import { body, param } from 'express-validator';

export const updateProfileValidator = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('bio')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Bio cannot exceed 150 characters')
    .trim()
];

export const userIdValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];
