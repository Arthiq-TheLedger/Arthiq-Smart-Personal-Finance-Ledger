const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { asId, sameId } = require('../utils/ids');

function authenticate(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = asId(decoded.userId);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function getCompanyAccess(userId, companyId) {
  const company = await pool.query('SELECT * FROM companies WHERE id = $1', [asId(companyId)]);
  if (!company.rows.length) return null;

  const c = company.rows[0];
  if (sameId(c.owner_id, userId)) {
    return { role: 'both', isOwner: true, company: c };
  }

  const access = await pool.query(
    'SELECT * FROM company_access WHERE company_id = $1 AND user_id = $2',
    [companyId, userId]
  );
  if (!access.rows.length) return null;

  return { role: access.rows[0].role, isOwner: false, company: c };
}

function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const access = await getCompanyAccess(req.userId, req.params.companyId || req.body.companyId);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    req.companyAccess = access;
    const role = access.role;
    const canReadLedger = role === 'read' || role === 'both' || role === 'write' || access.isOwner;
    const canViewReports = role === 'read' || role === 'both' || access.isOwner;
    const canWrite = role === 'write' || role === 'both' || access.isOwner;

    if (allowedRoles.includes('read') && !canReadLedger) {
      return res.status(403).json({ error: 'Read access required' });
    }
    if (allowedRoles.includes('reports') && !canViewReports) {
      return res.status(403).json({ error: 'Report access required' });
    }
    if (allowedRoles.includes('write') && !canWrite) {
      return res.status(403).json({ error: 'Write access required' });
    }
    next();
  };
}

async function requireCompanyUnlock(req, res, next) {
  const companyId = asId(req.params.companyId || req.body.companyId);
  const unlockToken = req.headers['x-company-unlock'];

  if (!unlockToken) {
    return res.status(403).json({ error: 'Company password required', needsUnlock: true });
  }

  const result = await pool.query(
    'SELECT * FROM company_unlocks WHERE token = $1 AND user_id = $2 AND company_id = $3 AND expires_at > NOW()',
    [unlockToken, req.userId, companyId]
  );

  if (!result.rows.length) {
    return res.status(403).json({ error: 'Invalid or expired company unlock', needsUnlock: true });
  }

  next();
}

module.exports = { authenticate, getCompanyAccess, requireRole, requireCompanyUnlock };
