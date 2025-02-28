import { queryDatabase } from '../utils/queryDatabase';


export async function getEquipment() {
  const sqlQuery = `
    SELECT * FROM EquipmentMST
    WHERE Active = 1
  `;
  return await queryDatabase(sqlQuery);
}


export async function addEquipment(name: string, description: string) {
  const sqlQuery = `INSERT INTO EquipmentMST (name, description) VALUES (@name, @description)`;
  return await queryDatabase(sqlQuery, { name, description });
}

