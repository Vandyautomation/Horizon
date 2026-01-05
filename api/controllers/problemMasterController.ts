import { queryDatabase } from '../utils/queryDatabase';

export async function getProblemGroup(name: string | undefined, page: number, pic: string | undefined) {
    const offset = (page - 1) * 15;
    const picClause = pic ? `LEFT JOIN IoT.dbo.problem_problem p on pg.id = p.problem_group_id LEFT JOIN IoT.dbo.problem_todo pt on p.id = pt.problem_id` : '';
    const whereClause = name && pic ? `WHERE pg.name like '%'+ @name + '%' and pt.pic = @pic` : name && !pic ? `WHERE pg.name like '%'+ @name + '%'` : !name && pic ? `WHERE pt.pic = @pic` : '';

    const countQuery = `SELECT COUNT(DISTINCT pg.id) as count FROM IoT.dbo.problem_problem_group pg ${picClause} ${whereClause}`;
    const totalItems = await queryDatabase(countQuery, { name, pic });
    const totalPages = Math.ceil(totalItems[0].count / 15);

    const sqlQuery = `
    SELECT pg.* FROM IoT.dbo.problem_problem_group pg
    ${picClause}
    ${whereClause}
    GROUP BY pg.id, pg.name
    ORDER BY pg.id asc
    OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
    `;
    try {
        const data = await queryDatabase(sqlQuery, { name, pic });
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

export async function getAllProblemGroups() {
    try {
        const sqlQuery = `
            SELECT id, name
            FROM IoT.dbo.problem_problem_group
            ORDER BY id ASC
        `;
        return await queryDatabase(sqlQuery);
    } catch (error: any) {
        console.error('Error getting all problem groups:', error);
        throw new Error(`Failed to get all problem groups: ${error.message}`);
    }
}

export async function createProblemGroup(name: string) {
    try {
        const sqlQuery = `
            INSERT INTO IoT.dbo.problem_problem_group (name)
            VALUES (@name)
        `;
        await queryDatabase(sqlQuery, { name });
        return { message: 'Problem group created successfully' };
    } catch (error: any) {
        console.error('Error creating problem group:', error);
        throw new Error(`Failed to create problem group: ${error.message}`);
    }
}

export async function updateProblemGroup(id: string, name: string) {
    try {
        const sqlQuery = `
            UPDATE IoT.dbo.problem_problem_group 
            SET name = @name
            WHERE id = @id
        `;
        await queryDatabase(sqlQuery, { id, name });
        return { message: 'Problem group updated successfully' };
    } catch (error: any) {
        console.error('Error updating problem group:', error);
        throw new Error(`Failed to update problem group: ${error.message}`);
    }
}

export async function deleteProblemGroup(id: string) {
    try {
        // Check if there are any problems associated with this group
        const checkQuery = `SELECT COUNT(*) as count FROM IoT.dbo.problem_problem WHERE problem_group_id = @id`;
        const result = await queryDatabase(checkQuery, { id });

        if (result[0].count > 0) {
            throw new Error('Hapus semua problem terlebih dahulu');
        }

        const sqlQuery = `DELETE FROM IoT.dbo.problem_problem_group WHERE id = @id`;
        await queryDatabase(sqlQuery, { id });
        return { message: 'Problem group deleted successfully' };
    } catch (error: any) {
        console.error('Error deleting problem group:', error);
        throw new Error(`Failed to delete problem group: ${error.message}`);
    }
}

export async function getProblem(name: string | undefined, groupId: string | undefined, page: number, filter: string | undefined, pic: string | undefined) {
    const offset = (page - 1) * 15;

    // Build WHERE clause conditions
    const conditions = [];
    const params: any = {};

    if (name) {
        conditions.push(`p.name LIKE '%' + @name + '%'`);
        params.name = name;
    }

    if (groupId) {
        conditions.push(`p.problem_group_id = @groupId`);
        params.groupId = groupId;
    }

    if (filter) {
        conditions.push(`p.process = @filter`);
        params.filter = filter;
    }

    if (pic) {
        conditions.push(`pt.pic = @pic`);
        params.pic = pic;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const joinClause = pic ? `LEFT JOIN IoT.dbo.problem_todo pt ON p.id = pt.problem_id` : '';

    // Get total count
    const countQuery = `SELECT COUNT(DISTINCT p.id) as count FROM IoT.dbo.problem_problem p ${joinClause} ${whereClause}`;
    const totalItems = await queryDatabase(countQuery, params);
    const totalPages = Math.ceil(totalItems[0].count / 15);

    // Main query
    const sqlQuery = `
        SELECT p.* FROM IoT.dbo.problem_problem p
        ${joinClause}
        ${whereClause}
        GROUP BY p.id, p.name, p.problem_group_id, p.color, p.process
        ORDER BY p.id DESC
        OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
    `;
    try {
        const data = await queryDatabase(sqlQuery, { name, groupId, filter, pic });
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

export async function getProblemsByGroupForProcess(groupId: string, process: string | undefined) {
    try {
        const sqlQuery = `
            SELECT p.id, p.name, p.problem_group_id, p.color
            FROM IoT.dbo.problem_problem p
            WHERE p.problem_group_id = @groupId
            ORDER BY p.id ASC
        `;
        return await queryDatabase(sqlQuery, { groupId });
    } catch (error: any) {
        console.error('Error getting problems for group:', error);
        throw new Error(`Failed to get problems for group: ${error.message}`);
    }
}

export async function createProblem(name: string, problem_group_id: string, color: string, process: string) {
    try {
        const sqlQuery = `
            INSERT INTO IoT.dbo.problem_problem (name, problem_group_id, color, process)
            VALUES (@name, @problem_group_id, @color, @process)
        `;
        await queryDatabase(sqlQuery, { name, problem_group_id, color, process });
        return { message: 'Problem created successfully' };
    } catch (error: any) {
        console.error('Error creating problem:', error);
        throw new Error(`Failed to create problem: ${error.message}`);
    }
}

export async function updateProblem(id: string, name: string, problem_group_id: string, color: string, process: string) {
    try {
        const sqlQuery = `
            UPDATE IoT.dbo.problem_problem 
            SET name = @name, problem_group_id = @problem_group_id, color = @color, process = @process
            WHERE id = @id
        `;
        await queryDatabase(sqlQuery, { id, name, problem_group_id, color, process });
        return { message: 'Problem updated successfully' };
    } catch (error: any) {
        console.error('Error updating problem:', error);
        throw new Error(`Failed to update problem: ${error.message}`);
    }
}

export async function deleteProblem(id: string) {
    try {
        // Check if there are any todos associated with this problem
        const checkQuery = `SELECT COUNT(*) as count FROM IoT.dbo.problem_todo WHERE problem_id = @id`;
        const result = await queryDatabase(checkQuery, { id });

        if (result[0].count > 0) {
            throw new Error('Cannot delete problem. There are todos associated with this problem.');
        }

        const sqlQuery = `DELETE FROM IoT.dbo.problem_problem WHERE id = @id`;
        await queryDatabase(sqlQuery, { id });
        return { message: 'Problem deleted successfully' };
    } catch (error: any) {
        console.error('Error deleting problem:', error);
        throw new Error(`Failed to delete problem: ${error.message}`);
    }
}

export async function getTodo(name: string | undefined, problemId: string | undefined, page: number, pic: string | undefined) {
    const offset = (page - 1) * 15;
    const picClause = pic ? `LEFT JOIN IoT.dbo.problem_problem p on pt.problem_id = p.id` : '';

    let whereConditions = [];
    if (name) whereConditions.push(`pt.name like '%'+ @name + '%'`);
    if (pic) whereConditions.push(`pt.pic = @pic`);
    if (problemId) whereConditions.push(`pt.problem_id = @problemId`);

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const totalItems = await queryDatabase(`SELECT COUNT(*) as count FROM IoT.dbo.problem_todo pt ${picClause} ${whereClause}`, { name, problemId, pic });
    const totalPages = Math.ceil(totalItems[0].count / 15);
    const sqlQuery = `
    SELECT pt.* FROM IoT.dbo.problem_todo pt
    ${picClause}
    ${whereClause}
    ORDER BY pt.id DESC
    OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
  `;
    try {
        const data = await queryDatabase(sqlQuery, { name, problemId, pic });
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

export async function getTodosByProblem(problemId: string) {
    try {
        const sqlQuery = `
            SELECT pt.id, pt.name, pt.problem_id, pt.pic, pt.is_escalated
            FROM IoT.dbo.problem_todo pt
            WHERE pt.problem_id = @problemId
              AND ISNULL(pt.is_deleted, 0) = 0
            ORDER BY pt.id ASC
        `;
        return await queryDatabase(sqlQuery, { problemId });
    } catch (error: any) {
        console.error('Error getting todos for problem:', error);
        throw new Error(`Failed to get todos for problem: ${error.message}`);
    }
}

export async function createTodo(name: string, problem_id: string, pic: string, is_escalated: boolean) {
    try {
        const sqlQuery = `
            INSERT INTO IoT.dbo.problem_todo (name, problem_id, pic, is_escalated)
            VALUES (@name, @problem_id, @pic, @is_escalated)
        `;
        await queryDatabase(sqlQuery, { name, problem_id, pic, is_escalated });
        return { message: 'Todo created successfully' };
    } catch (error: any) {
        console.error('Error creating todo:', error);
        throw new Error(`Failed to create todo: ${error.message}`);
    }
}

export async function updateTodo(id: string, name: string, problem_id: string, pic: string, is_escalated: boolean) {
    try {
        const sqlQuery = `
            UPDATE IoT.dbo.problem_todo 
            SET name = @name, problem_id = @problem_id, pic = @pic, is_escalated = @is_escalated
            WHERE id = @id
        `;
        await queryDatabase(sqlQuery, { id, name, problem_id, pic, is_escalated });
        return { message: 'Todo updated successfully' };
    } catch (error: any) {
        console.error('Error updating todo:', error);
        throw new Error(`Failed to update todo: ${error.message}`);
    }
}

export async function deleteTodo(id: string) {
    try {
        const sqlQuery = `DELETE FROM IoT.dbo.problem_todo WHERE id = @id`;
        await queryDatabase(sqlQuery, { id });
        return { message: 'Todo deleted successfully' };
    } catch (error: any) {
        console.error('Error deleting todo:', error);
        throw new Error(`Failed to delete todo: ${error.message}`);
    }
}

