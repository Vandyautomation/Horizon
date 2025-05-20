import { queryDatabase } from '../utils/queryDatabase';


export async function getEquipment() {
  const sqlQuery = `
    SELECT * FROM EquipmentMST
    WHERE Active = 1
  `;
  return await queryDatabase(sqlQuery);
}


export async function addEquipment(equipmentId: string, category: string, name: string, brand: string, energyBudget: string) {
  const sqlQuery = `
  INSERT INTO EquipmentMST (EquipmentId, Category, name, brand, energyBudget, created_at, modified_at, active) 
  VALUES (@equipmentId, @category, @name, @brand, @energyBudget, getdate(), getdate(), 1)`;
  try {
    return await queryDatabase(sqlQuery, { equipmentId, category, name, brand, energyBudget });
  } catch (error: any) {
    throw new Error(`Failed to add equipment: ${error.message}`);
  }
}

export async function updateEquipment(id: number, equipmentId: string, category: string, name: string, brand: string, energyBudget: string) {
  const sqlQuery = `
  UPDATE EquipmentMST 
  SET Category = @category, 
      equipmentId = @equipmentId,
      name = @name, 
      brand = @brand, 
      energyBudget = @energyBudget, 
      modified_at = getdate()
  WHERE id = @id`;
  try {
    return await queryDatabase(sqlQuery, { id, equipmentId, category, name, brand, energyBudget });
  } catch (error: any) {
    throw new Error(`Failed to update equipment: ${error.message}`);
  }
}

export async function deleteEquipment(id: number) {
  const sqlQuery = `
  UPDATE EquipmentMST 
  SET active = 0, 
      modified_at = getdate()
  WHERE id = @id`;
  try {
    return await queryDatabase(sqlQuery, { id });
  } catch (error: any) {
    throw new Error(`Failed to delete equipment: ${error.message}`);
  }
}