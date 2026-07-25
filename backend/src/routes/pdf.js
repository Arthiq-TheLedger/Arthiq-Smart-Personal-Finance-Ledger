const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { authenticate, requireRole, requireCompanyUnlock } = require('../middleware/auth');
const { calculateRunningBalances } = require('../utils/balance');
const { asId } = require('../utils/ids');
const { registerPdfFonts, pickFont } = require('../utils/pdfFonts');

const router = express.Router();

router.use(authenticate);

const MARGIN = 40;
const TABLE_WIDTH = 515;
const MIN_ROW_HEIGHT = 22;
const GRID_COLOR = '#d1d5db';
const HEADER_BG = '#f1f5f9';
const ALT_ROW_BG = '#f8fafc';

const COLS = [
  { label: 'Date', width: 72, align: 'left', key: 'date' },
  { label: 'Particulars', width: 188, align: 'left', key: 'title' },
  { label: '+/-', width: 32, align: 'center', key: 'sign' },
  { label: 'Amount', width: 88, align: 'right', key: 'amount' },
  { label: 'Balance', width: 78, align: 'right', key: 'balance' },
  { label: 'By', width: 57, align: 'left', key: 'by' },
];

function colX(index) {
  let x = MARGIN;
  for (let i = 0; i < index; i++) x += COLS[i].width;
  return x;
}

function drawGrid(doc, topY, rowHeights) {
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
  const bottomY = topY + MIN_ROW_HEIGHT + totalHeight;
  doc.save().lineWidth(0.5).strokeColor(GRID_COLOR);

  let x = MARGIN;
  for (let c = 0; c <= COLS.length; c++) {
    doc.moveTo(x, topY).lineTo(x, bottomY).stroke();
    if (c < COLS.length) x += COLS[c].width;
  }

  doc.moveTo(MARGIN, topY).lineTo(MARGIN + TABLE_WIDTH, topY).stroke();
  doc.moveTo(MARGIN, topY + MIN_ROW_HEIGHT).lineTo(MARGIN + TABLE_WIDTH, topY + MIN_ROW_HEIGHT).stroke();

  let y = topY + MIN_ROW_HEIGHT;
  for (const h of rowHeights) {
    y += h;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + TABLE_WIDTH, y).stroke();
  }
  doc.restore();
}

function drawHeaderRow(doc, y, fonts) {
  doc.rect(MARGIN, y, TABLE_WIDTH, MIN_ROW_HEIGHT).fill(HEADER_BG);
  doc.fillColor('#334155').font(fonts.bodyBold).fontSize(8);

  COLS.forEach((col, i) => {
    doc.text(col.label, colX(i) + 4, y + 7, {
      width: col.width - 8,
      align: col.align,
    });
  });
}

function measureRowHeight(doc, entry, fonts) {
  const title = String(entry.title ?? '');
  doc.font(fonts.body).fontSize(8);
  const titleHeight = doc.heightOfString(title, { width: COLS[1].width - 8 });
  return Math.max(MIN_ROW_HEIGHT, titleHeight + 12);
}

function drawDataRow(doc, y, entry, rowIndex, rowHeight, fonts) {
  if (rowIndex % 2 === 0) {
    doc.rect(MARGIN, y, TABLE_WIDTH, rowHeight).fill(ALT_ROW_BG);
  }

  const sign = entry.entry_type === 'credit' ? '+' : '-';
  const balanceText =
    entry.show_balance && entry.balance_snapshot != null
      ? formatCurrency(entry.balance_snapshot)
      : '';

  const title = String(entry.title ?? '');
  const byName = entry.created_by_name?.split(' ')[0] || '';

  const cells = [
    { text: formatDate(entry.entry_date), font: fonts.latin, align: 'left', color: '#0f172a', col: 0 },
    { text: title, font: fonts.body, align: 'left', color: '#0f172a', col: 1, wrap: true },
    { text: sign, font: fonts.latin, align: 'center', color: sign === '+' ? '#059669' : '#dc2626', col: 2 },
    { text: formatCurrency(entry.amount), font: fonts.latin, align: 'right', color: '#0f172a', col: 3 },
    { text: balanceText, font: fonts.latin, align: 'right', color: '#0f172a', col: 4 },
    { text: byName, font: pickFont(byName, fonts), align: 'left', color: '#0f172a', col: 5 },
  ];

  cells.forEach((cell) => {
    const i = cell.col;
    doc.font(cell.font).fontSize(8).fillColor(cell.color);
    doc.text(cell.text, colX(i) + 4, y + 6, {
      width: COLS[i].width - 8,
      align: cell.align,
      lineBreak: cell.wrap !== false,
    });
  });
}

router.get('/:companyId', requireRole('reports'), requireCompanyUnlock, async (req, res) => {
  const companyId = asId(req.params.companyId);
  const { from, to, title } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to date parameters required' });
  }

  try {
    let query = `
      SELECT le.*, u.name AS created_by_name
      FROM ledger_entries le
      JOIN users u ON u.id = le.created_by
      WHERE le.company_id = $1 AND le.entry_date >= $2 AND le.entry_date <= $3`;
    const params = [companyId, from, to];

    if (title?.trim()) {
      params.push(`%${title.trim()}%`);
      query += ` AND le.title ILIKE $${params.length}`;
    }

    query += ' ORDER BY le.entry_date ASC, le.id ASC';

    const company = await pool.query('SELECT name FROM companies WHERE id = $1', [companyId]);
    const result = await pool.query(query, params);

    const entries = calculateRunningBalances(result.rows);
    const companyName = company.rows[0]?.name || 'Ledger';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(companyName)}-ledger.pdf"`
    );

    const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: true });
    const fonts = registerPdfFonts(doc);
    doc.pipe(res);

    doc.font(fonts.bodyBold).fontSize(18).fillColor('#0f172a').text(companyName, { align: 'center' });
    doc.font(fonts.body).fontSize(11).fillColor('#475569').text('Personal Finance Ledger', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).text(`Period: ${formatDate(from)} to ${formatDate(to)}`, { align: 'center' });
    if (title?.trim()) {
      doc.fontSize(9).text(`Filter: ${title.trim()}`, { align: 'center' });
    }
    doc.moveDown(1);

    let tableTop = doc.y;
    const pageBottom = 760;

    if (entries.length === 0) {
      drawHeaderRow(doc, tableTop, fonts);
      drawGrid(doc, tableTop, []);
      doc.fillColor('#64748b').font(fonts.body).fontSize(9).text(
        'No entries in this period.',
        MARGIN + 4,
        tableTop + MIN_ROW_HEIGHT + 8
      );
    } else {
      let sliceStart = 0;
      while (sliceStart < entries.length) {
        if (sliceStart > 0) {
          doc.addPage();
          tableTop = MARGIN;
        }

        drawHeaderRow(doc, tableTop, fonts);

        const rowHeights = [];
        let y = tableTop + MIN_ROW_HEIGHT;
        let sliceEnd = sliceStart;

        while (sliceEnd < entries.length) {
          const rowHeight = measureRowHeight(doc, entries[sliceEnd], fonts);
          if (y + rowHeight > pageBottom && sliceEnd > sliceStart) break;
          if (y + rowHeight > pageBottom && sliceEnd === sliceStart) {
            rowHeights.push(rowHeight);
            y += rowHeight;
            sliceEnd += 1;
            break;
          }
          rowHeights.push(rowHeight);
          y += rowHeight;
          sliceEnd += 1;
        }

        rowHeights.forEach((h, i) => {
          drawDataRow(doc, tableTop + MIN_ROW_HEIGHT + rowHeights.slice(0, i).reduce((a, b) => a + b, 0), entries[sliceStart + i], i, h, fonts);
        });

        drawGrid(doc, tableTop, rowHeights);

        if (sliceEnd >= entries.length) {
          const last = entries[entries.length - 1];
          const footerY = tableTop + MIN_ROW_HEIGHT + rowHeights.reduce((a, b) => a + b, 0) + 14;
          doc.font(fonts.bodyBold).fontSize(10).fillColor('#0f172a');
          doc.text(`Closing Balance: ${formatCurrency(last.running_balance)}`, MARGIN, footerY);
        }

        sliceStart = sliceEnd;
      }
    }

    doc.font(fonts.latin).fontSize(8).fillColor('#94a3b8');
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
