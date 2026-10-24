/**
 * MySQL DATETIME columns hold no timezone. The application stores them in UTC
 * and formats them the way MySQL expects, so comparisons stay consistent no
 * matter where the server runs.
 */
function toDbDateTime(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

/** Millisecond precision, for columns declared DATETIME(6). */
function toDbDateTimeMs(date = Date.now()) {
  return new Date(date).toISOString().slice(0, 23).replace('T', ' ');
}

function fromDbDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  // '2026-10-24 18:05:00' -> treat as UTC
  return new Date(`${text.replace(' ', 'T')}Z`);
}

function nowPlus(ms) {
  return toDbDateTime(Date.now() + ms);
}

module.exports = { toDbDateTime, toDbDateTimeMs, fromDbDateTime, nowPlus };
