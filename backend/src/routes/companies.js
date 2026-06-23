const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { authenticate, getCompanyAccess } = require('../middleware/auth');
const { asId } = require('../utils/ids');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const owned = await pool.query(
      `SELECT c.id, c.name, c.description, c.created_at, true AS is_owner, 'both' AS role
       FROM companies c WHERE c.owner_id = $1 ORDER BY c.created_at DESC`,
      [req.userId]
    );

    const shared = await pool.query(
      `SELECT c.id, c.name, c.description, c.created_at, false AS is_owner, ca.role
       FROM companies c
       JOIN company_access ca ON ca.company_id = c.id
       WHERE ca.user_id = $1 ORDER BY c.created_at DESC`,
      [req.userId]
    );

    res.json([...owned.rows, ...shared.rows]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/', async (req, res) => {
  const { name, password, description } = req.body;
  if (!name?.trim() || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO companies (name, password_hash, owner_id, description) VALUES ($1, $2, $3, $4) RETURNING id, name, description, created_at',
      [name.trim(), hash, req.userId, description || null]
    );
    res.status(201).json({ ...result.rows[0], is_owner: true, role: 'both' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

router.post('/:companyId/unlock', async (req, res) => {
  const companyId = asId(req.params.companyId);
  const { password } = req.body;

  const access = await getCompanyAccess(req.userId, companyId);
  if (!access) return res.status(403).json({ error: 'Access denied' });

  const valid = await bcrypt.compare(password, access.company.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO company_unlocks (user_id, company_id, token, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, company_id) DO UPDATE SET token = $3, expires_at = $4`,
    [req.userId, companyId, token, expiresAt]
  );

  res.json({ unlockToken: token, expiresAt });
});

router.delete('/:companyId', async (req, res) => {
  const companyId = asId(req.params.companyId);
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required to delete company' });
  }

  const access = await getCompanyAccess(req.userId, companyId);
  if (!access?.isOwner) return res.status(403).json({ error: 'Only owner can delete' });

  const valid = await bcrypt.compare(password, access.company.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  await pool.query('DELETE FROM company_unlocks WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM companies WHERE id = $1', [companyId]);
  res.json({ message: 'Company deleted' });
});

router.get('/:companyId/members', async (req, res) => {
  const companyId = asId(req.params.companyId);
  const access = await getCompanyAccess(req.userId, companyId);
  if (!access) return res.status(403).json({ error: 'Access denied' });

  const owner = await pool.query(
    `SELECT u.id, u.email, u.name, u.avatar_url, 'owner' AS role
     FROM users u JOIN companies c ON c.owner_id = u.id WHERE c.id = $1`,
    [companyId]
  );

  const members = await pool.query(
    `SELECT u.id, u.email, u.name, u.avatar_url, ca.role, ca.created_at
     FROM company_access ca JOIN users u ON u.id = ca.user_id
     WHERE ca.company_id = $1`,
    [companyId]
  );

  res.json({ owner: owner.rows[0], members: members.rows });
});

router.post('/:companyId/share', async (req, res) => {
  const companyId = asId(req.params.companyId);
  const { email, role } = req.body;

  if (!['read', 'write', 'both'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const access = await getCompanyAccess(req.userId, companyId);
  if (!access?.isOwner) return res.status(403).json({ error: 'Only owner can share' });

  const user = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!user.rows.length) {
    return res.status(404).json({ error: 'User not found. They must register first.' });
  }

  const targetUserId = user.rows[0].id;
  if (targetUserId === req.userId) {
    return res.status(400).json({ error: 'Cannot share with yourself' });
  }

  try {
    await pool.query(
      `INSERT INTO company_access (company_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id, user_id) DO UPDATE SET role = $3`,
      [companyId, targetUserId, role, req.userId]
    );
    res.json({ message: 'Access granted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to share company' });
  }
});

router.delete('/:companyId/members/:userId', async (req, res) => {
  const companyId = asId(req.params.companyId);
  const targetUserId = asId(req.params.userId);

  const access = await getCompanyAccess(req.userId, companyId);
  if (!access?.isOwner) return res.status(403).json({ error: 'Only owner can remove members' });

  await pool.query('DELETE FROM company_access WHERE company_id = $1 AND user_id = $2', [
    companyId,
    targetUserId,
  ]);
  res.json({ message: 'Member removed' });
});

module.exports = router;
