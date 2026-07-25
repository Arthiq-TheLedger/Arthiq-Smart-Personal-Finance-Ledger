const path = require('path');
const fs = require('fs');

const FONT_DIR = path.join(__dirname, '../../assets/fonts');
const UNICODE_FONT = path.join(FONT_DIR, 'NotoSansDevanagari-Regular.ttf');
const LATIN_FONT = path.join(FONT_DIR, 'NotoSans-Regular.ttf');

const DEVANAGARI_RE = /[\u0900-\u097F]/;

function registerPdfFonts(doc) {
  const hasUnicode = fs.existsSync(UNICODE_FONT);
  const hasLatin = fs.existsSync(LATIN_FONT);

  if (hasUnicode) {
    doc.registerFont('Unicode', UNICODE_FONT);
    doc.registerFont('Unicode-Bold', UNICODE_FONT);
  }
  if (hasLatin) {
    doc.registerFont('Latin', LATIN_FONT);
    doc.registerFont('Latin-Bold', LATIN_FONT);
  }

  return {
    hindi: hasUnicode ? 'Unicode' : 'Helvetica',
    hindiBold: hasUnicode ? 'Unicode-Bold' : 'Helvetica-Bold',
    latin: hasLatin ? 'Latin' : 'Helvetica',
    latinBold: hasLatin ? 'Latin-Bold' : 'Helvetica-Bold',
  };
}

function splitTextRuns(text) {
  const value = String(text ?? '');
  if (!value) return [{ text: '', devanagari: false }];

  const runs = [];
  let buffer = '';
  let mode = null;

  for (const char of value) {
    const isDevanagari = DEVANAGARI_RE.test(char);
    if (mode === null) {
      mode = isDevanagari;
      buffer = char;
      continue;
    }
    if (isDevanagari === mode) {
      buffer += char;
    } else {
      runs.push({ text: buffer, devanagari: mode });
      buffer = char;
      mode = isDevanagari;
    }
  }

  if (buffer) runs.push({ text: buffer, devanagari: mode });
  return runs;
}

function fontForRun(run, fonts) {
  return run.devanagari ? fonts.hindi : fonts.latin;
}

function measureMixedTextHeight(doc, text, width, fonts, fontSize = 8) {
  const runs = splitTextRuns(text);
  if (runs.length === 1) {
    doc.font(fontForRun(runs[0], fonts)).fontSize(fontSize);
    return doc.heightOfString(runs[0].text, { width });
  }

  doc.fontSize(fontSize);
  let height = 0;
  runs.forEach((run, index) => {
    doc.font(fontForRun(run, fonts));
    height = Math.max(
      height,
      doc.heightOfString(run.text, {
        width,
        continued: index < runs.length - 1,
      })
    );
  });
  return height;
}

function drawMixedText(doc, text, x, y, width, fonts, options = {}) {
  const { fontSize = 8, color = '#0f172a', align = 'left' } = options;
  const runs = splitTextRuns(text);

  doc.fillColor(color).fontSize(fontSize);

  if (runs.length === 1) {
    doc.font(fontForRun(runs[0], fonts)).text(runs[0].text, x, y, { width, align, lineBreak: true });
    return;
  }

  runs.forEach((run, index) => {
    doc.font(fontForRun(run, fonts)).text(run.text, index === 0 ? x : undefined, index === 0 ? y : undefined, {
      width: index === 0 ? width : undefined,
      align: index === 0 ? align : undefined,
      lineBreak: true,
      continued: index < runs.length - 1,
    });
  });
}

function hasDevanagari(text) {
  return DEVANAGARI_RE.test(String(text ?? ''));
}

function pickFont(text, fonts) {
  return hasDevanagari(text) ? fonts.hindi : fonts.latin;
}

module.exports = {
  registerPdfFonts,
  splitTextRuns,
  measureMixedTextHeight,
  drawMixedText,
  hasDevanagari,
  pickFont,
};
