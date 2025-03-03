import { queryDatabase } from '../utils/queryDatabase';


export async function getLocation() {
  const sqlQuery = `
    SELECT MchLoc as name FROM IoT.dbo.MachineMST
    WHERE Active = 1 
    group by MchLoc
  `;
  return await queryDatabase(sqlQuery);
}


export async function addLocation(name: string) {
  const sqlQuery = `INSERT INTO EquipmentMST (name, description) VALUES (@name, @description)`;
  return await queryDatabase(sqlQuery, { name });
}

