function asId(value) {
  if (value == null || value === '') return null;
  return String(value);
}

function sameId(a, b) {
  return asId(a) === asId(b);
}

module.exports = { asId, sameId };
