const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/?error=auth_failed`, session: false }),
  (req, res) => {
    const token = jwt.sign({ userId: String(req.user.id) }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = require('../config/db');
    const result = await pool.query('SELECT id, email, name, avatar_url FROM users WHERE id = $1', [
      decoded.userId,
    ]);
    if (!result.rows.length) return res.status(401).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
