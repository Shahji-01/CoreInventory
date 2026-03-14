const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const hashPassword = (password) => bcrypt.hashSync(password, 12);
const verifyPassword = (password, hash) => bcrypt.compareSync(password, hash);
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

module.exports = { hashPassword, verifyPassword, signToken };
