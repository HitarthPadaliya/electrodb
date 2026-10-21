const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  enableLabConsole: process.env.ENABLE_LAB_CONSOLE !== 'false',
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
