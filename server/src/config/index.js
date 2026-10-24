const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  enableLabConsole: process.env.ENABLE_LAB_CONSOLE !== 'false',
  trustProxy: process.env.TRUST_PROXY === 'true',

  // `mysql` (default) is the real store. `memory` is used by the preview server
  // and by the automated tests, which have no database to talk to.
  personalStore: process.env.PERSONAL_STORE === 'memory' ? 'memory' : 'mysql',

  session: {
    cookieName: process.env.SESSION_COOKIE_NAME || 'electrodb_sid',
    ttlHours: Math.max(1, parseInt(process.env.SESSION_TTL_HOURS || '168', 10)),
    // Cookies can only be Secure over HTTPS; production defaults to on and the
    // flag exists so a plain-HTTP staging box can opt out explicitly.
    secureCookie: process.env.SESSION_COOKIE_SECURE
      ? process.env.SESSION_COOKIE_SECURE === 'true'
      : isProduction
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

module.exports = config;
