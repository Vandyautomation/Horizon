import { queryDatabase } from '@/api/utils/queryDatabase';
import data from "@/api/controllers/qco/data.json"


export async function getManufacturingData() {
  // const sqlQuery = `
  //   SELECT UAP as name FROM IoT.dbo.MachineMST
  //   WHERE Active = 1 and UAP != ''
  //   Group by UAP
  // `;
  return data;
  // return await queryDatabase(sqlQuery);
}


export async function addUap(name: string) {
  const sqlQuery = `INSERT INTO EquipmentMST (name, description) VALUES (@name, @description)`;
  return await queryDatabase(sqlQuery, { name });
}

