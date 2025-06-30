const mysql = require('mysql2/promise');
const defaults = require('../config/defaults');
const fs = require('fs/promises');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.DB_HOST || defaults.db.host,
  user: process.env.DB_USER || defaults.db.user,
  password: process.env.DB_PW || defaults.db.password,
  database: process.env.DB_NAME || defaults.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || defaults.db.host,
    user: process.env.DB_USER || defaults.db.user,
    password: process.env.DB_PW || defaults.db.password,
  });

  const filePath = path.join(__dirname, '../database/init.sql');
  const sql = await fs.readFile(filePath, { encoding: 'utf8' });
  await connection.query(sql);
  await connection.end();
}

// IIFE to ensure DB exists before usage
(async () => {
  try {
    await ensureDatabaseExists();
    console.log('✅ Database check complete');
  } catch (err) {
    console.error('❌ Failed to ensure database exists:', err.message);
  }
})();

async function query(sql, params) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows, fields] = await connection.execute(sql, params);
    await connection.commit();
    return [rows, fields];
  } catch (err) {
    await connection.rollback();
    console.error('❌ SQL Execution Error:', err.message);
    throw err;
  } finally {
    connection.release();
  }
}

async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    console.error('❌ Transaction Error:', err.message);
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  query, pool, ensureDatabaseExists, transaction
};
