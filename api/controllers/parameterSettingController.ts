import { queryDatabase } from '../utils/queryDatabase';

export async function getParameterSetting(name: string | undefined, page: number) {

    const offset = (page - 1) * 15;
    const totalItems = await queryDatabase(`SELECT COUNT(*) as count FROM IoT.dbo.parameter_setting WHERE name like '%'+ @name + '%'`, { name });
    const totalPages = Math.ceil(totalItems[0].count / 15);
    const sqlQuery = `
    SELECT * FROM IoT.dbo.parameter_setting
    ORDER BY id DESC
    OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
  `;
    try {
        const data = await queryDatabase(sqlQuery, { name });
        return {
            data,
            totalPages,
            totalItems
        };
    } catch (error: any) {
        console.error('Error getting parameter setting:', error);
        throw new Error(`Failed to get parameter setting: ${error.message}`);
    }
}