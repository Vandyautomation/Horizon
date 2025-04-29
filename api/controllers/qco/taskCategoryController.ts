import { queryDatabase } from '@/api/utils/queryDatabase';

export async function getTaskCategories() {
    const taskCategories = `
        SELECT * FROM IoT.dbo.[task_categories]
    `;
    const taskCategoriesResult = await queryDatabase(taskCategories);

    const subTasks = `
        SELECT * FROM IoT.dbo.[sub_tasks]
    `;
    const subTasksResult = await queryDatabase(subTasks);

    const roles = `
        SELECT * FROM IoT.dbo.[roles]
    `;
    const rolesResult = await queryDatabase(roles);

    const combinedResults = taskCategoriesResult.map((category: any) => ({
        ...category,
        subtasks: subTasksResult.filter((subtask: any) => Number(subtask.category_id) === Number(category.id))
    }));

    const finalResult = combinedResults.map((category: any) => ({

        ...category,
        subtasks: category.subtasks.map((subtask: any) => ({
            ...subtask,
            roles: rolesResult.filter((role: any) => Number(role.id) === Number(subtask.role_id))[0]
        }))
    }));


    return finalResult;
}

export async function getTaskCategoryById(uuid: string) {
    const sqlQuery = `
        SELECT * FROM IoT.dbo.[task_categories] WHERE uuid = @uuid
    `;
    return await queryDatabase(sqlQuery, { uuid });
}

export async function createTaskCategory(name: string, description: string) {
    const sqlQuery = `
        INSERT INTO IoT.dbo.[task_categories] (name, description, created_at, updated_at)
        VALUES (@name, @description, GETDATE(), GETDATE())
    `;
    return await queryDatabase(sqlQuery, { name, description });
}
export async function updateTaskCategory(uuid: string, name: string, description: string) {
    const sqlQuery = `
        UPDATE IoT.dbo.[task_categories]
        SET name = @name, description = @description, updated_at = GETDATE()
        WHERE uuid = @uuid
    `;
    return await queryDatabase(sqlQuery, { uuid, name, description });
}
export async function deleteTaskCategory(uuid: string) {
    const sqlQuery = `
        DELETE FROM IoT.dbo.[task_categories]
        WHERE uuid = @uuid
    `;
    return await queryDatabase(sqlQuery, { uuid });
}