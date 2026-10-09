const { Pool, types } = require('pg');
require('dotenv').config();

// By default the pg driver converts PostgreSQL DATE columns to JS Date objects
// at UTC midnight, which causes a 1-day shift when displayed in IST (+05:30).
// Override the DATE parser (OID 1082) to return the raw YYYY-MM-DD string instead.
types.setTypeParser(1082, (val) => val); // DATE → plain string

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;