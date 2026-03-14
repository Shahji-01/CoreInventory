const AuthService = require('../services/authService');
const { success } = require('../utils/apiResponse');

// POST /api/auth/login
const login = async (req, res) => {
  const result = await AuthService.login(req.body);
  return success(res, result);
};

// POST /api/auth/register
const register = async (req, res) => {
  const result = await AuthService.register(req.body);
  return success(res, result, 201);
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const result = AuthService.getMe(req.user);
  return success(res, result);
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const result = await AuthService.requestOtp(req.body.email);
  return success(res, result);
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await AuthService.resetPassword(email, otp, newPassword);
  return success(res, result);
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const result = await AuthService.updateProfile(req.user._id, req.body);
  return success(res, result);
};

module.exports = { login, register, getMe, updateProfile, forgotPassword, resetPassword };
