require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8000,
  JWT_SECRET: process.env.JWT_SECRET || 'thesource_super_secret_jwt_key_2026_renewable_iot',
  JWT_EXPIRES_IN: '24h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DB_PATH: process.env.DB_PATH || './pern_case_study.db'
};
