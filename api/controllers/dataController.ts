import { queryDatabase } from '../utils/queryDatabase';

export async function getData() {
  const sqlQuery = 'SELECT * FROM your_table';
  return await queryDatabase(sqlQuery);
}

export async function addData(name: string, age: number) {
  const sqlQuery = `INSERT INTO your_table (name, age) VALUES (@name, @age)`;
  return await queryDatabase(sqlQuery, { name, age });
}
