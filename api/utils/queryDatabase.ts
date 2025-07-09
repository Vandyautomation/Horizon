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
