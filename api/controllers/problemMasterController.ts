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
            throw new Error('Cannot delete problem group. There are problems associated with this group.');
        }

        const sqlQuery = `DELETE FROM IoT.dbo.problem_problem_group WHERE id = @id`;
        await queryDatabase(sqlQuery, { id });
        return { message: 'Problem group deleted successfully' };
    } catch (error: any) {
        console.error('Error deleting problem group:', error);
        throw new Error(`Failed to delete problem group: ${error.message}`);
    }
}

export async function getProblem(name: string | undefined, groupId: string | undefined, page: number, filter: string | undefined) {
    const offset = (page - 1) * 15;
    const whereClause = name ? `WHERE name like '%'+ @name + '%'` : '';
    const groupClause = name && groupId ? `and problem_group_id = @groupId` : !name && groupId ? `where problem_group_id = @groupId` : '';
    const filterClause = filter && name ? `and process = @filter` : filter && !name ? `where process = @filter` : '';
    const totalItems = await queryDatabase(`SELECT COUNT(*) as count FROM IoT.dbo.problem_problem ${whereClause} ${groupClause} ${filterClause}`, { name, groupId, filter });
    const totalPages = Math.ceil(totalItems[0].count / 15);
    const sqlQuery = `
    SELECT * FROM IoT.dbo.problem_problem
    ${whereClause}
    ${filterClause}
    ${groupClause}
    ORDER BY id DESC
    OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
  `;
    try {
        const data = await queryDatabase(sqlQuery, { name, groupId, filter });
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

