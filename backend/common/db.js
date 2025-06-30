const mysql = require('mysql2/promise');
const defaults = require('../config/defaults');

// Re-use the connection where possible
let connection;

async function connect() {
  // Don't proceed if the connection's already been established
  if (connection) return;

  // Use default settings to try and connect if nothing specific is passed in
  const connOpts = {
    host: process.env.DB_HOST || defaults.db.host,
    user: process.env.DB_USER || defaults.db.user,
    password: process.env.DB_PASSWORD || defaults.db.password,
    database: defaults.db.name
  };

  // Cache the connection for later use
  try {
    connection = await mysql.createConnection(connOpts);
    console.debug("🎬 Connected to the database");
  } catch (err) {
    if (['ER_BAD_DB_ERROR', 'ER_ACCESS_DENIED_ERROR'].includes(err.code)) {
      throw new Error(`Database ${connOpts.database} doesn't exist. Make sure You've run "sceneit_init.sh" from the root directory!`);
    } else {
      throw err;
    }
  }
}


async function query(sql, params) {
  // No existing connection - connect using defaults
  if (!connection) {
    await connect();
  }

  const [rows, _fields] = await connection.execute(sql, params);

  return rows;
}

async function disconnect() {
  if (connection) connection.end();
  connection = undefined;
}


module.exports = { connect, query, disconnect };
