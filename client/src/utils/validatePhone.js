export const PHONE_ERROR_MESSAGE = 'Phone number must be exactly 10 digits';

const PHONE_PATTERN = /^\d{10}$/;

export const isValidNepaliPhone = (v) => PHONE_PATTERN.test((v || '').trim());

export const sanitizePhone = (value) => (value || '').replace(/\D/g, '').slice(-10);

export const PHONE_INPUT_PROPS = {
  type: 'tel',
  inputMode: 'numeric',
  pattern: '[0-9]{10}',
  maxLength: 10,
};

export const PHONE_ERROR_CLASS =
  'mt-1 text-xs font-medium text-red-600';