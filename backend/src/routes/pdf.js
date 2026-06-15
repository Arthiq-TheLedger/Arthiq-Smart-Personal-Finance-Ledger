const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { authenticate, requireRole, requireCompanyUnlock } = require('../middleware/auth');
const { calculateRunningBalances } = require('../utils/balance');

const router = express.Router();

router.use(authenticate);

const MARGIN = 40;
const TABLE_WIDTH = 515;
const ROW_HEIGHT = 22;
const GRID_COLOR = '#d1d5db';
const HEADER_BG = '#f1f5f9';
const ALT_ROW_BG = '#f8fafc';

const COLS = [
  { label: 'Date', width: 72, align: 'left' },
  { label: 'Particulars', width: 188, align: 'left' },
  { label: '+/-', width: 32, align: 'center' },
  { label: 'Amount', width: 88, align: 'right' },
  { label: 'Balance', width: 78, align: 'right' },
  { label: 'By', width: 57, align: 'left' },
];

function colX(index) {
  let x = MARGIN;
  for (let i = 0; i < index; i++) x += COLS[i].width;
  return x;
}

function drawGrid(doc, topY, rowCount) {
  const bottomY = topY + ROW_HEIGHT * (rowCount + 1);
  doc.save().lineWidth(0.5).strokeColor(GRID_COLOR);

  let x = MARGIN;
  for (let c = 0; c <= COLS.length; c++) {
    doc.moveTo(x, topY).lineTo(x, bottomY).stroke();
    if (c < COLS.length) x += COLS[c].width;
  }
  for (let r = 0; r <= rowCount + 1; r++) {
    const y = topY + r * ROW_HEIGHT;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + TABLE_WIDTH, y).stroke();
  }
  doc.restore();
}

function drawHeaderRow(doc, y) {
  doc.rect(MARGIN, y, TABLE_WIDTH, ROW_HEIGHT).fill(HEADER_BG);
  doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8);

  COLS.forEach((col, i) => {
    doc.text(col.label, colX(i) + 4, y + 7, {
      width: col.width - 8,
      align: col.align,
    });
  });
}

function drawDataRow(doc, y, entry, rowIndex) {
  if (rowIndex % 2 === 0) {
    doc.rect(MARGIN, y, TABLE_WIDTH, ROW_HEIGHT).fill(ALT_ROW_BG);
  }

  const sign = entry.entry_type === 'credit' ? '+' : '-';
  const balanceText =
    entry.show_balance && entry.balance_snapshot != null
      ? formatCurrency(entry.balance_snapshot)
      : '';

  const cells = [
    { text: formatDate(entry.entry_date), align: 'left', color: '#0f172a' },
    { text: entry.title, align: 'left', color: '#0f172a' },
    { text: sign, align: 'center', color: sign === '+' ? '#059669' : '#dc2626' },
    { text: formatCurrency(entry.amount), align: 'right', color: '#0f172a' },
    { text: balanceText, align: 'right', color: '#0f172a' },
    { text: entry.created_by_name?.split(' ')[0] || '', align: 'left', color: '#0f172a' },
  ];

  doc.font('Helvetica').fontSize(8);
  cells.forEach((cell, i) => {
    doc.fillColor(cell.color).text(cell.text, colX(i) + 4, y + 7, {
      width: COLS[i].width - 8,
      align: cell.align,
      ellipsis: true,
    });
  });
}

router.get('/:companyId', requireRole('reports'), requireCompanyUnlock, async (req, res) => {
  const companyId = parseInt(req.params.companyId);
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to date parameters required' });
  }

  try {
    const company = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);
    const result = await pool.query(
      `SELECT le.*, u.name AS created_by_name
       FROM ledger_entries le
       JOIN users u ON u.id = le.created_by
       WHERE le.company_id = $1 AND le.entry_date >= $2 AND le.entry_date <= $3
       ORDER BY le.entry_date ASC, le.id ASC`,
      [companyId, from, to]
    );

    const entries = calculateRunningBalances(result.rows);
    const companyName = company.rows[0]?.name || 'Ledger';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${companyName}-ledger.pdf"`);

    const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a').text(companyName, { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#475569').text('Personal Finance Ledger', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).text(`Period: ${formatDate(from)} to ${formatDate(to)}`, { align: 'center' });
    doc.moveDown(1);

    let tableTop = doc.y;
    const maxRowsPerPage = 28;

    if (entries.length === 0) {
      drawHeaderRow(doc, tableTop);
      drawGrid(doc, tableTop, 0);
      doc.fillColor('#64748b').fontSize(9).text('No entries in this period.', MARGIN + 4, tableTop + ROW_HEIGHT + 8);
    } else {
      for (let page = 0; page < entries.length; page += maxRowsPerPage) {
        if (page > 0) {
          doc.addPage();
          tableTop = MARGIN;
        }

        const slice = entries.slice(page, page + maxRowsPerPage);
        drawHeaderRow(doc, tableTop);

        slice.forEach((entry, i) => {
          drawDataRow(doc, tableTop + ROW_HEIGHT * (i + 1), entry, i);
        });

        drawGrid(doc, tableTop, slice.length);

        if (page + maxRowsPerPage >= entries.length) {
          const last = entries[entries.length - 1];
          const footerY = tableTop + ROW_HEIGHT * (slice.length + 1) + 14;
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
          doc.text(`Closing Balance: ${formatCurrency(last.running_balance)}`, MARGIN, footerY);
        }
      }
    }

    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
    doc.text('Generated by Arthiq — Smart Personal Finance Ledger', MARGIN, 780, {
      align: 'center',
      width: TABLE_WIDTH,
    });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  return `Rs.${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

module.exports = router;
