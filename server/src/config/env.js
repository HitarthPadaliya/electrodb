const path = require('node:path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

function bool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const nodeEnv = process.env.NODE_ENV || 'development';
module.exports = {
  port: Number.parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  labEnabled: bool(process.env.ENABLE_LAB_CONSOLE, nodeEnv !== 'production'),
  database: {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: Number.parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10)
  }
};
