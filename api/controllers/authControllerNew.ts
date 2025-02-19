import { queryDatabase } from '../utils/queryDatabase';

export async function loginUser(nik: string, password: string) {
  const sqlQuery = `SELECT * FROM UserAccessMST where UserRFID = @nik`;
  return await queryDatabase(sqlQuery, {nik});
}
