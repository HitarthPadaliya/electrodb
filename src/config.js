const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  enableLabConsole: process.env.ENABLE_LAB_CONSOLE !== 'false',
  trustProxy: process.env.TRUST_PROXY === 'true',

      personalStore: process.env.PERSONAL_STORE === 'memory' ? 'memory' : 'mysql',

  session: {
    cookieName: process.env.SESSION_COOKIE_NAME || 'electrodb_sid',
    ttlHours: Math.max(1, parseInt(process.env.SESSION_TTL_HOURS || '168', 10)),
            secureCookie: process.env.SESSION_COOKIE_SECURE
      ? process.env.SESSION_COOKIE_SECURE === 'true'
      : isProduction,
                        sameSite: String(process.env.SESSION_COOKIE_SAMESITE || 'lax').toLowerCase()
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'electrodb_app',
    password: process.env.DB_PASSWORD || 'electrodb_app_pwd',
    database: process.env.DB_NAME || 'electrodb',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    charset: 'utf8mb4'
  }
};

function toDbDateTime(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

function toDbDateTimeMs(date = Date.now()) {
  return new Date(date).toISOString().slice(0, 23).replace('T', ' ');
}

function fromDbDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value);
    return new Date(`${text.replace(' ', 'T')}Z`);
}

function nowPlus(ms) {
  return toDbDateTime(Date.now() + ms);
}

module.exports = {
  config,
  toDbDateTime,
  toDbDateTimeMs,
  fromDbDateTime,
  nowPlus
};
