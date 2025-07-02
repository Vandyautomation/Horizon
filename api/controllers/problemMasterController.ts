import { queryDatabase } from '../utils/queryDatabase';

export async function getProblemGroup(name: string | undefined, page: number) {
    const offset = (page - 1) * 15;
    const whereClause = name ? `WHERE name like '%'+ @name + '%'` : '';
    const totalItems = await queryDatabase(`SELECT COUNT(*) as count FROM IoT.dbo.problem_problem_group ${whereClause}`, { name });
    const totalPages = Math.ceil(totalItems[0].count / 15);
    const sqlQuery = `
    SELECT * FROM IoT.dbo.problem_problem_group 
    ${whereClause}
    ORDER BY id asc
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
        console.error('Error getting problem group:', error);
        throw new Error(`Failed to get problem group: ${error.message}`);
    }
}

export async function getProblem(name: string | undefined, groupId: string | undefined, page: number) {
    const offset = (page - 1) * 15;
    const whereClause = name ? `WHERE name like '%'+ @name + '%'` : '';
    const groupClause = name && groupId ? `and problem_group_id = @groupId` : !name && groupId ? `where problem_group_id = @groupId` : '';
    const totalItems = await queryDatabase(`SELECT COUNT(*) as count FROM IoT.dbo.problem_problem ${whereClause} ${groupClause}`, { name, groupId });
    const totalPages = Math.ceil(totalItems[0].count / 15);
    const sqlQuery = `
    SELECT * FROM IoT.dbo.problem_problem
    ${whereClause}
    ${groupClause}
    ORDER BY id DESC
    OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
  `;
    try {
        const data = await queryDatabase(sqlQuery, { name, groupId });
        return {
            data,
            totalPages,
            totalItems
        };
    } catch (error: any) {
        console.error('Error getting problem:', error);
        throw new Error(`Failed to get problem: ${error.message}`);
    }
}

export async function getTodo(name: string | undefined, problemId: string | undefined, page: number) {
    const offset = (page - 1) * 15;
    const whereClause = name ? `WHERE name like '%'+ @name + '%'` : '';
    const problemClause = name && problemId ? `and problem_id = @problemId` : !name && problemId ? `where problem_id = @problemId` : '';
    const totalItems = await queryDatabase(`SELECT COUNT(*) as count FROM IoT.dbo.problem_todo ${whereClause} ${problemClause}`, { name, problemId });
    const totalPages = Math.ceil(totalItems[0].count / 15);
    const sqlQuery = `
    SELECT * FROM IoT.dbo.problem_todo
    ${whereClause}
    ${problemClause}
    ORDER BY id DESC
    OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
  `;
    try {
        const data = await queryDatabase(sqlQuery, { name, problemId });
        return {
            data,
            totalPages,
            totalItems
        };
    } catch (error: any) {
        console.error('Error getting todo:', error);
        throw new Error(`Failed to get todo: ${error.message}`);
    }
}

