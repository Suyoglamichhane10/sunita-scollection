const PHONE_ERROR_MESSAGE = 'Phone number must be exactly 10 digits';
const PHONE_PATTERN = /^\d{10}$/;

const normalizePhone = (value) => {
  if (value === undefined || value === null) return value;
  return String(value).trim();
};

const isValidPhone = (value) => {
  const normalized = normalizePhone(value);
  if (normalized === undefined || normalized === null || normalized === '') return true;
  return PHONE_PATTERN.test(normalized);
};

const phoneField = (options = {}) => ({
  type: String,
  trim: true,
  ...(options.required ? { required: true } : {}),
  ...(options.default !== undefined ? { default: options.default } : {}),
});

/**
 * Mongoose does not resolve `.$*.` wildcards through `get()`/`isModified()`,
 * so array wildcards are expanded into concrete per-index paths.
 */
const expandPaths = (doc, paths) => {
  const expanded = [];
  for (const path of paths) {
    const star = path.indexOf('.$*.');
    if (star === -1) {
      expanded.push(path);
      continue;
    }
    const arrayPath = path.slice(0, star);
    const suffix = path.slice(star + 4);
    const array = doc.get(arrayPath);
    if (Array.isArray(array) && array.length > 0) {
      array.forEach((_, index) => expanded.push(`${arrayPath}.${index}.${suffix}`));
    }
  }
  return expanded;
};

/**
 * Enforces the 10-digit format at the schema level.
 *
 * Only phone paths this save actually writes are checked, so records that
 * predate the rule keep loading and saving untouched until their phone is
 * edited. New documents have every path written, so nothing invalid can be
 * inserted.
 */
const registerPhoneValidation = (schema, paths) => {
  schema.pre('validate', function enforcePhoneFormat(next) {
    for (const path of expandPaths(this, paths)) {
      if (!this.isNew && !this.isModified(path)) continue;
      const value = this.get(path);
      if (value === undefined || value === null || value === '') continue;
      if (isValidPhone(value)) continue;
      const error = new Error(PHONE_ERROR_MESSAGE);
      error.statusCode = 400;
      return next(error);
    }
    next();
  });
};

const rejectInvalidPhone = (res, value) => {
  if (isValidPhone(value)) return false;
  res.status(400).json({ success: false, message: PHONE_ERROR_MESSAGE });
  return true;
};

const rejectInvalidPhones = (res, values) => {
  if (values.every((value) => isValidPhone(value))) return false;
  res.status(400).json({ success: false, message: PHONE_ERROR_MESSAGE });
  return true;
};

module.exports = {
  PHONE_ERROR_MESSAGE,
  PHONE_PATTERN,
  normalizePhone,
  isValidPhone,
  phoneField,
  registerPhoneValidation,
  rejectInvalidPhone,
  rejectInvalidPhones,
};