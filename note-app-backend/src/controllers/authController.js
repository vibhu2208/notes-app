/**
 * Authentication controller
 * Handles user registration, login, logout, and token refresh
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/config');
const logger = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} = require('../utils/errors');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate tokens
  const tokens = user.generateTokens();
  await user.save();

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  logger.info(`New user registered: ${email}`);

  // Set HTTP-only cookie for refresh token
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken: tokens.accessToken,
    },
    message: 'User registered successfully',
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findByEmailWithPassword(email);
  
  if (!user || !(await user.comparePassword(password))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const tokens = user.generateTokens();
  await user.save();

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in: ${email}`);

  // Set HTTP-only cookie for refresh token
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    data: {
      user,
      accessToken: tokens.accessToken,
    },
    message: 'Login successful',
  });
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = asyncHandler(async (req, res) => {
  const user = req.user;

  // Clear refresh token from database
  user.refreshToken = undefined;
  await user.save();

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  logger.info(`User logged out: ${user.email}`);

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 * @access Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: tokenFromBody } = req.body;
  const tokenFromCookie = req.cookies.refreshToken;
  
  const refreshToken = tokenFromBody || tokenFromCookie;
  
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    
    // Find user with this refresh token
    const user = await User.findByRefreshToken(refreshToken);
    
    if (!user || user._id.toString() !== decoded.id) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = user.generateTokens();
    await user.save();

    // Set new refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw error;
  }
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = req.user;

  if (name) {
    user.name = name;
  }

  await user.save();

  logger.info(`User profile updated: ${user.email}`);

  res.json({
    success: true,
    data: {
      user,
    },
    message: 'Profile updated successfully',
  });
});

/**
 * Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
};
