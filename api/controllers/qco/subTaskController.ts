import { queryDatabase } from '@/api/utils/queryDatabase';

export async function getSubTask() {

    const subTasks = `
        SELECT * FROM IoT.dbo.[sub_tasks]
    `;
    const subTasksResult = await queryDatabase(subTasks);


    return subTasksResult;
}

export async function getSubTaskById(id: string) {
    const sqlQuery = `
        SELECT * FROM IoT.dbo.[sub_tasks] WHERE id = @id
    `;
    return await queryDatabase(sqlQuery, { id });
}

export async function createSubTask(body: { name: string; index: number; role_id: number; standard_time: number; is_parallel: boolean; is_preparation: boolean }, categoryId: number) {
    const uuid = crypto.randomUUID();
    const sqlQuery = `
        INSERT INTO IoT.dbo.[sub_tasks] 
        (uuid, name, created_at, updated_at, category_id, [index], role_id, standard_time, is_parallel, is_preparation)
        VALUES 
        (@uuid, @name, GETDATE(), GETDATE(), @categoryId, @index, @role_id, @standard_time, @is_parallel, @is_preparation)
    `;
    return await queryDatabase(sqlQuery, { name: body.name, categoryId, uuid, index: body.index, role_id: body.role_id, standard_time: body.standard_time, is_parallel: body.is_parallel, is_preparation: body.is_preparation });
}
export async function updateSubTask(id: string, body: { name: string; index: number; role_id: number; standard_time: number; is_parallel: boolean; is_preparation: boolean }) {
    const sqlQuery = `
        UPDATE IoT.dbo.[sub_tasks]
        SET name = @name, [index] = @index, role_id = @role_id, standard_time = @standard_time, is_parallel = @is_parallel, is_preparation = @is_preparation, updated_at = GETDATE()
        WHERE id = @id
    `;
    return await queryDatabase(sqlQuery, { id, name: body.name, index: body.index, role_id: body.role_id, standard_time: body.standard_time, is_parallel: body.is_parallel, is_preparation: body.is_preparation });
}
export async function deleteSubTask(id: number) {
    const sqlQuery = `
        DELETE FROM IoT.dbo.[sub_tasks]
        WHERE id = @id
    `;
    return await queryDatabase(sqlQuery, { id });
}