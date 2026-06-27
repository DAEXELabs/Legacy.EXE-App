export const MINIMUM_AGE = 18;

export function parseBirthday(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export function calculateAge(birthday) {
  const parsed = birthday instanceof Date ? birthday : parseBirthday(birthday);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - parsed.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - parsed.getUTCMonth();
  const dayDiff = now.getUTCDate() - parsed.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function meetsMinimumAge(birthday) {
  const age = calculateAge(birthday);
  return age !== null && age >= MINIMUM_AGE;
}

export function formatBirthday(birthday) {
  const parsed = birthday instanceof Date ? birthday : parseBirthday(birthday);
  if (!parsed) return '';
  return parsed.toISOString().slice(0, 10);
}