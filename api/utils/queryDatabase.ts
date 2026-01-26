import sql from 'mssql';
import { pool } from '../config/database';


export async function queryDatabase(sqlQuery: string, params: { [key: string]: any } = {}) {
  const connection = await pool;
  const request = connection.request();

  // Add input parameters
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });

  try {
    const result = await request.query(sqlQuery);
    return result.recordset;
  } catch (error: any) {
    console.error('❌ Database query error:');
    console.error('➡️ Query:', sqlQuery);
    console.error('➡️ Params:', params);
    console.error('➡️ Error:', error);
    if (
      error?.name === 'TimeoutError' ||
      error?.message?.includes('operation timed out') ||
      error?.message?.includes('acquire connection from pool')
    ) {
      console.error('🚨 Fatal database timeout or stuck connection pool. Restarting...');
      process.exit(1); // Trigger restart via pm2 or systemd
    }
    throw error;
  }
}

export async function queryDatabaseInTransaction(
  transaction: sql.Transaction,
  sqlQuery: string,
  params: { [key: string]: any } = {}
) {
  const request = transaction.request();

  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });

  try {
    const result = await request.query(sqlQuery);
    return result.recordset;
  } catch (error: any) {
    console.error('âŒ Database query error (transaction):');
    console.error('âž¡ï¸ Query:', sqlQuery);
    console.error('âž¡ï¸ Params:', params);
    console.error('âž¡ï¸ Error:', error);
    throw error;
  }
}

export async function withTransaction<T>(fn: (tx: sql.Transaction) => Promise<T>) {
  const connection = await pool;
  const transaction = new sql.Transaction(connection);

  await transaction.begin();
  try {
    const result = await fn(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('âŒ Failed to rollback transaction:', rollbackError);
    }
    throw error;
  }
}

export async function streamQuery(sqlQuery: string, params: { [key: string]: any } = {}, onRow: (row: any) => void): Promise<void> {
  const connection = await pool;
  const request = connection.request();
  request.stream = true; // Enable streaming

  // Add input parameters
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });

  return new Promise((resolve, reject) => {
    request.on('recordset', (columns: any) => {
      // Optional: handle column metadata
    });

    request.on('row', (row: any) => {
      onRow(row); // 🔥 Handle each row here
    });

    request.on('error', (err: any) => {
      console.error('❌ Streaming query error:', err);
      reject(err);
    });

    request.on('done', (result: any) => {
      resolve(); // Finished
    });

    // Start the query
    request.query(sqlQuery);
  });
}
