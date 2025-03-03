import { queryDatabase } from '../utils/queryDatabase';


export async function getUap() {
  const sqlQuery = `
    SELECT UAP as name FROM IoT.dbo.MachineMST
    WHERE Active = 1 and UAP != ''
    Group by UAP
  `;
  return await queryDatabase(sqlQuery);
}


export async function addUap(name: string) {
  const sqlQuery = `INSERT INTO EquipmentMST (name, description) VALUES (@name, @description)`;
  return await queryDatabase(sqlQuery, { name });
}

