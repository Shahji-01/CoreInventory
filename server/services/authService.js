const User = require('../models/User');
const { hashPassword, verifyPassword, signToken } = require('../utils/authUtils');
const { sendOtpEmail } = require('../utils/emailUtils');

class AuthService {
  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error('Email and password required');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = signToken({ userId: user._id, email: user.email, role: user.role });
    return { 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } 
    };
  }

  async register({ name, email, password }) {
    if (!name || !email || !password) {
      const error = new Error('Name, email, and password required');
      error.statusCode = 400;
      throw error;
    }
    
    if (password.length < 6) {
      const error = new Error('Password must be at least 6 characters');
      error.statusCode = 400;
      throw error;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const error = new Error('Email already registered');
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      passwordHash: hashPassword(password), 
      role: 'admin' 
    });
    
    const token = signToken({ userId: user._id, email: user.email, role: user.role });
    return { 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } 
    };
  }

  async requestOtp(email) {
    if (!email) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { message: 'If that email is registered, an OTP has been sent.' };
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    await user.save();

    // Send email using Nodemailer
    await sendOtpEmail(user.email, otp);

    return { 
      message: 'If that email is registered, an OTP has been sent.'
    };
  }

  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      const error = new Error('Email, OTP, and new password are required');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error('New password must be at least 6 characters');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      const error = new Error('OTP is invalid or has expired');
      error.statusCode = 400;
      throw error;
    }

    user.passwordHash = hashPassword(newPassword);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password has been successfully reset' };
  }

  getMe(userObj) {
    return { 
      id: userObj._id, 
      name: userObj.name, 
      email: userObj.email, 
      role: userObj.role, 
      createdAt: userObj.createdAt 
    };
  }

  async updateProfile(userId, { name, password }) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    if (name) user.name = name;
    if (password) {
      if (password.length < 6) {
        const error = new Error('Password must be at least 6 characters');
        error.statusCode = 400;
        throw error;
      }
      user.passwordHash = hashPassword(password);
    }
    await user.save();
    return this.getMe(user);
  }
}

module.exports = new AuthService();
