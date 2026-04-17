import sql from 'mssql';

let timeout = 180000;

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
    connectTimeout: 8000,
    requestTimeout: timeout,
    enableFeatureExtension: false
  },
  pool: {
    max: 10, // Maximum connections in pool
    min: 0,
    idleTimeoutMillis: 8000,
  },
};

let poolPromise = null;

function createPoolPromise() {
  const connectionPool = new sql.ConnectionPool(dbConfig);
  return connectionPool.connect();
}

export function getPool() {
  if (!poolPromise) {
    poolPromise = createPoolPromise();
  }
  return poolPromise;
}

export async function resetPool() {
  const current = poolPromise;
  poolPromise = null;

  if (current) {
    try {
      const connected = await current;
      await connected.close();
    } catch {
      // ignore close/reset error
    }
  }

  poolPromise = createPoolPromise();
  return poolPromise;
}

// Backward compatibility for existing imports
export const pool = getPool();
