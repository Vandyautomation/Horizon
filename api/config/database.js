import sql from 'mssql';

const dbConfig = {
  user: 'SA',
  password: 'PojokMeja@12',
  server: '93.127.185.15', // e.g., 'localhost'
  database: 'IoT_APP',
  options: {
    encrypt: true, // Use SSL if required by your setup
    enableArithAbort: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10, // Maximum connections in pool
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const pool = new sql.ConnectionPool(dbConfig).connect();
