import sql from 'mssql';
import { pool } from '../config/database';

type QueryOptions = {
  deadlockRetries?: number;
  deadlockRetryDelayMs?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isDeadlockError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const numberCode =
    Number(error?.number) ||
    Number(error?.code) ||
    Number(error?.originalError?.info?.number);

  return (
    numberCode === 1205 ||
    message.includes('deadlock victim') ||
    message.includes('deadlocked on lock resources')
  );
};

const isLikelyReadOnlyQuery = (sqlQuery: string) => {
  const normalized = sqlQuery.trim().toLowerCase();
  const startsAsRead =
    normalized.startsWith('select') ||
    normalized.startsWith('with') ||
    normalized.startsWith(';with') ||
    normalized.startsWith('declare');

  const hasWriteKeyword = /\b(insert|update|delete|merge|truncate)\b/i.test(
    sqlQuery
  );

  return startsAsRead && !hasWriteKeyword;
};

export async function queryDatabase(
  sqlQuery: string,
  params: { [key: string]: any } = {},
  options: QueryOptions = {}
) {
  const defaultRetries = isLikelyReadOnlyQuery(sqlQuery) ? 2 : 0;
  const maxRetries = Math.max(0, options.deadlockRetries ?? defaultRetries);
  const retryDelayMs = Math.max(50, options.deadlockRetryDelayMs ?? 120);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const connection = await pool;
    const request = connection.request();

    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    try {
      const result = await request.query(sqlQuery);
      return result.recordset;
    } catch (error: any) {
      const deadlock = isDeadlockError(error);
      const hasMoreRetry = deadlock && attempt < maxRetries;

      if (hasMoreRetry) {
        console.warn(
          `Deadlock detected, retrying query (${attempt + 1}/${maxRetries})...`
        );
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      console.error('Database query error:');
      console.error('Query:', sqlQuery);
      console.error('Params:', params);
      console.error('Error:', error);

      if (
        error?.name === 'TimeoutError' ||
        error?.message?.includes('operation timed out') ||
        error?.message?.includes('acquire connection from pool')
      ) {
        console.error(
          'Fatal database timeout or stuck connection pool. Restarting...'
        );
        process.exit(1);
      }

      throw error;
    }
  }

  throw new Error('Database query failed after deadlock retries');
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
    console.error('Database query error (transaction):');
    console.error('Query:', sqlQuery);
    console.error('Params:', params);
    console.error('Error:', error);
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
      console.error('Failed to rollback transaction:', rollbackError);
    }
    throw error;
  }
}

export async function streamQuery(
  sqlQuery: string,
  params: { [key: string]: any } = {},
  onRow: (row: any) => void
): Promise<void> {
  const connection = await pool;
  const request = connection.request();
  request.stream = true;

  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });

  return new Promise((resolve, reject) => {
    request.on('recordset', (_columns: any) => {
      // Optional: handle column metadata
    });

    request.on('row', (row: any) => {
      onRow(row);
    });

    request.on('error', (err: any) => {
      console.error('Streaming query error:', err);
      reject(err);
    });

    request.on('done', (_result: any) => {
      resolve();
    });

    request.query(sqlQuery);
  });
}
