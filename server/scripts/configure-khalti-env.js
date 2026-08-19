/**
 * Safely appends Khalti test config to server/.env (idempotent).
 * Reads the file as text so the '&' in the eSewa key doesn't break shell parsing.
 * Usage: node scripts/configure-khalti-env.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
let content = fs.readFileSync(envPath, 'utf8');

const lines = content.split(/\r?\n/);
const hasEnv = lines.some((l) => /^KHALTI_ENV=/.test(l.trim()));
const hasBase = lines.some((l) => /^KHALTI_BASE_URL=/.test(l.trim()));

let changed = false;
if (!hasEnv) {
  if (!content.endsWith('\n')) content += '\n';
  content += 'KHALTI_ENV=test\n';
  changed = true;
}
if (!hasBase) {
  if (!content.endsWith('\n')) content += '\n';
  content += 'KHALTI_BASE_URL=https://dev.khalti.com/api/v2\n';
  changed = true;
}

fs.writeFileSync(envPath, content, 'utf8');
console.log(changed ? 'OK: added KHALTI_ENV=test and KHALTI_BASE_URL' : 'No change (already configured)');
