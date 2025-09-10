// export const API_BASE_URL = 'http://localhost:3001/api'
export const API_BASE_URL = process.env.API_BASE_URL;

export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  PROFILE: '/auth/profile',

  // User management
  UPDATE_PROFILE: '/users/profile', // PUT
  UPLOAD_AVATAR: '/users/profile/picture', // POST

  // Posts
  POSTS: '/posts',
  POST_BY_ID: '/posts',
  USER_POSTS: '/posts/user',

  // Likes
  LIKE_POST: '/likes/post',
  LIKE_COMMENT: '/likes/comment',

  // Comments
  COMMENTS: '/comments',
  COMMENT_REPLIES: '/comments',

  // Notifications
  NOTIFICATIONS: '/notifications',
  MARK_READ: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER: 500,
};
