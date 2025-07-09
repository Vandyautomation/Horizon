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
  } catch (error) {
    console.error('❌ Database query error:');
    console.error('➡️ Query:', sqlQuery);
    console.error('➡️ Params:', params);
    console.error('➡️ Error:', error);
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