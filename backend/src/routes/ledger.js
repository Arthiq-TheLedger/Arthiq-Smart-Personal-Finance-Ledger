const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole, requireCompanyUnlock } = require('../middleware/auth');
const { calculateRunningBalances, computeBalanceUpTo } = require('../utils/balance');
const { asId, sameId } = require('../utils/ids');

const router = express.Router();

router.use(authenticate);

function isWriteOnly(access) {
  return access && !access.isOwner && access.role === 'write';
}

async function fetchPriorEntries(companyId, userId, access) {
  let query = 'SELECT * FROM ledger_entries WHERE company_id = $1';
  const params = [companyId];
  if (isWriteOnly(access)) {
    params.push(userId);
    query += ' AND created_by = $2';
  }
  query += ' ORDER BY entry_date ASC, id ASC';
  return pool.query(query, params);
}

router.get('/:companyId', requireRole('read'), requireCompanyUnlock, async (req, res) => {
  const companyId = asId(req.params.companyId);
  const { from, to } = req.query;

  try {
    let query = `
      SELECT le.*, u.name AS created_by_name, u.email AS created_by_email
      FROM ledger_entries le
      JOIN users u ON u.id = le.created_by
      WHERE le.company_id = $1`;
    const params = [companyId];

    if (isWriteOnly(req.companyAccess)) {
      params.push(req.userId);
      query += ` AND le.created_by = $${params.length}`;
    }

    if (from) {
      params.push(from);
      query += ` AND le.entry_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND le.entry_date <= $${params.length}`;
    }

    query += ' ORDER BY le.entry_date ASC, le.id ASC';

    const result = await pool.query(query, params);
    const entries = calculateRunningBalances(result.rows);
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

router.post('/:companyId', requireRole('write'), requireCompanyUnlock, async (req, res) => {
  const companyId = asId(req.params.companyId);
  const { entry_date, title, entry_type, amount, show_balance } = req.body;

  if (!entry_date || !title?.trim() || !['credit', 'debit'].includes(entry_type) || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid entry data' });
  }

  try {
    const prior = await fetchPriorEntries(companyId, req.userId, req.companyAccess);

    const tempEntry = { entry_type, amount: parseFloat(amount) };
    const allEntries = [...prior.rows, tempEntry];
    const balances = calculateRunningBalances(allEntries);
    const runningBalance = balances[balances.length - 1].running_balance;

    const result = await pool.query(
      `INSERT INTO ledger_entries (company_id, entry_date, title, entry_type, amount, balance_snapshot, show_balance, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        companyId,
        entry_date,
        title.trim(),
        entry_type,
        amount,
        show_balance ? runningBalance : null,
        !!show_balance,
        req.userId,
      ]
    );

    const user = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.userId]);
    const entry = {
      ...result.rows[0],
      created_by_name: user.rows[0].name,
      created_by_email: user.rows[0].email,
      ghost_balance: runningBalance,
      running_balance: runningBalance,
      display_balance: show_balance ? runningBalance : null,
    };

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

router.patch('/:companyId/:entryId/balance', requireRole('write'), requireCompanyUnlock, async (req, res) => {
  const companyId = asId(req.params.companyId);
  const entryId = asId(req.params.entryId);
  const { show_balance } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM ledger_entries WHERE id = $1 AND company_id = $2',
      [entryId, companyId]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Entry not found' });
    if (isWriteOnly(req.companyAccess) && !sameId(existing.rows[0].created_by, req.userId)) {
      return res.status(403).json({ error: 'You can only modify your own entries' });
    }

    const prior = await fetchPriorEntries(companyId, req.userId, req.companyAccess);

    const balance = computeBalanceUpTo(prior.rows, entryId);

    const result = await pool.query(
      `UPDATE ledger_entries SET show_balance = $1, balance_snapshot = $2
       WHERE id = $3 AND company_id = $4 RETURNING *`,
      [!!show_balance, show_balance ? balance : null, entryId, companyId]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update balance display' });
  }
});

router.delete('/:companyId/:entryId', requireRole('write'), requireCompanyUnlock, async (req, res) => {
  const companyId = asId(req.params.companyId);
  const entryId = asId(req.params.entryId);

  let result;
  if (isWriteOnly(req.companyAccess)) {
    result = await pool.query(
      'DELETE FROM ledger_entries WHERE id = $1 AND company_id = $2 AND created_by = $3 RETURNING id',
      [entryId, companyId, req.userId]
    );
  } else {
    result = await pool.query(
      'DELETE FROM ledger_entries WHERE id = $1 AND company_id = $2 RETURNING id',
      [entryId, companyId]
    );
  }

  if (!result.rows.length) {
    return res.status(
      isWriteOnly(req.companyAccess) ? 403 : 404,
      isWriteOnly(req.companyAccess)
        ? { error: 'Entry not found or you can only delete your own entries' }
        : { error: 'Entry not found' }
    );
  }
  res.json({ message: 'Entry deleted' });
});

router.get('/:companyId/summary', requireRole('reports'), requireCompanyUnlock, async (req, res) => {
  const companyId = asId(req.params.companyId);

  try {
    const entries = await pool.query(
      'SELECT entry_type, amount, title, entry_date FROM ledger_entries WHERE company_id = $1',
      [companyId]
    );

    let totalCredit = 0;
    let totalDebit = 0;
    const byTitle = {};
    const byMonth = {};

    for (const e of entries.rows) {
      const amt = parseFloat(e.amount);
      if (e.entry_type === 'credit') totalCredit += amt;
      else totalDebit += amt;

      byTitle[e.title] = byTitle[e.title] || { credit: 0, debit: 0 };
      byTitle[e.title][e.entry_type] += amt;

      const month = e.entry_date.toISOString().slice(0, 7);
      byMonth[month] = byMonth[month] || { credit: 0, debit: 0 };
      byMonth[month][e.entry_type] += amt;
    }

    res.json({
      totalCredit,
      totalDebit,
      balance: totalCredit - totalDebit,
      byTitle: Object.entries(byTitle).map(([title, v]) => ({ title, ...v, net: v.credit - v.debit })),
      byMonth: Object.entries(byMonth)
        .map(([month, v]) => ({ month, ...v, net: v.credit - v.debit }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      entryCount: entries.rows.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
