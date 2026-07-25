const path = require('path');
const fs = require('fs');

const FONT_DIR = path.join(__dirname, '../../assets/fonts');
const UNICODE_FONT = path.join(FONT_DIR, 'NotoSansDevanagari-Regular.ttf');
const LATIN_FONT = path.join(FONT_DIR, 'NotoSans-Regular.ttf');

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
    body: hasUnicode ? 'Unicode' : 'Helvetica',
    bodyBold: hasUnicode ? 'Unicode-Bold' : 'Helvetica-Bold',
    latin: hasLatin ? 'Latin' : 'Helvetica',
  };
}

function pickFont(text, fonts) {
  if (/[\u0900-\u097F]/.test(text)) return fonts.body;
  return fonts.latin;
}

module.exports = { registerPdfFonts, pickFont };
