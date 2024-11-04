import { pool } from '../config/database';

export async function queryDatabase(sqlQuery: string, params: { [key: string]: any } = {}) {
  const connection = await pool;
  const request = connection.request();

  // Add input parameters to prevent SQL injection
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });

  try {
    const result = await request.query(sqlQuery);
    return result.recordset;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
