import sql from 'mssql';
import { getPool, resetPool } from '../config/database';

type QueryOptions = {
  deadlockRetries?: number;
  deadlockRetryDelayMs?: number;
  parserRetries?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runRequestQuery = (request: sql.Request, sqlQuery: string) =>
  new Promise<sql.IResult<any>>((resolve, reject) => {
    let settled = false;

    request.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });

    request.query(sqlQuery, (err, result) => {
      if (settled) return;
      settled = true;
      if (err) {
        reject(err);
        return;
      }
      resolve(result as sql.IResult<any>);
    });
  });

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

const isTediousParserError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const stack = String(error?.stack || '').toLowerCase();
  return (
    stack.includes('tedious') &&
    (
      message.includes('unknown type:') ||
      message.includes('unexpected end of data') ||
      message.includes('unsupported datalength') ||
      message.includes('unsupported numeric datalength')
    )
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
  const parserMaxRetries = Math.max(0, options.parserRetries ?? 1);
  let parserAttempt = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const connection = await getPool();
    const request = connection.request();

    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    try {
      const result = await runRequestQuery(request, sqlQuery);
      return result.recordset;
    } catch (error: any) {
      if (isTediousParserError(error) && parserAttempt < parserMaxRetries) {
        parserAttempt += 1;
        console.warn(
          `Tedious parser error detected, resetting DB pool and retrying (${parserAttempt}/${parserMaxRetries})...`
        );
        await resetPool();
        await sleep(150 * parserAttempt);
        attempt -= 1;
        continue;
      }

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
        console.error('Database timeout/pool issue detected. Query failed, keeping service alive.');
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
    const result = await runRequestQuery(request, sqlQuery);
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
  const connection = await getPool();
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
  const connection = await getPool();
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
