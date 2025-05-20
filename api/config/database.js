import sql from 'mssql';

let timeout = 90000;

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST, // e.g., 'localhost'
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Use SSL if required by your setup
    enableArithAbort: true,
    trustServerCertificate: true,
    connectTimeout: timeout,
    requestTimeout: timeout,
    // 🐛 Add this block for debugging Tedious
    debug: {
      packet: true,
      data: true,
      payload: true,
      token: true
    }
  },
  pool: {
    max: 10, // Maximum connections in pool
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const pool = new sql.ConnectionPool(dbConfig).connect();

