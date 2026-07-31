export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export function isValidBrazilianPhone(value) {
  const digits = normalizePhone(value);
  return /^(\d{2})(9\d{8})$/.test(digits);
}
