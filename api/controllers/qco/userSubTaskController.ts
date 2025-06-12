import { authMiddleware } from '@/api/middleware/authMiddleware';
import { queryDatabase } from '@/api/utils/queryDatabase';
import { Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';




// Get user sub task by UUID
export async function getUserSubTaskById(uuid: string) {
    const sqlQuery = `
        SELECT * FROM IoT.dbo.[user_sub_tasks] WHERE uuid = @uuid
    `;
    return await queryDatabase(sqlQuery, { uuid });
}

// Start user sub task
export async function startUserSubTask(c: Context, uuid: string) {
    // Get user from context that was set by authMiddleware
    const user = c.get('user').user;
    // console.log(user)
    const userId = user.id;

    const userSubTask = await getUserSubTaskById(uuid);
    if (!userSubTask || userSubTask.length === 0) {
        throw new HTTPException(404, { message: 'Subtask not found' });
    }

    if (userSubTask[0].start_time) {
        throw new HTTPException(400, { message: 'Sorry, the sub task has been started previously' });
    }
    if (userSubTask[0].status === 'canceled') {
        throw new HTTPException(400, { message: 'Sorry, the sub task has been canceled' });
    }

    const userSubTaskId = userSubTask[0].id;
    const taskId = userSubTask[0].task_id;



    const subTaskBeforeQuery = `
        SELECT TOP 1 * FROM IoT.dbo.[user_sub_tasks] 
        WHERE uuid != @uuid and id < @userSubTaskId and task_id = @taskId and ended_at IS NULL
        ORDER BY id DESC
        `
    const subTaskBefore = await queryDatabase(subTaskBeforeQuery, { uuid, userSubTaskId, taskId });
    // console.log("subTaskBefore", subTaskBefore)

    if (subTaskBefore && subTaskBefore.length > 0) {
        // Check if tasks are non-parallel and previous task is not ended
        if (!subTaskBefore[0].is_parallel && !userSubTask[0].is_parallel && !subTaskBefore[0].ended_at) {
            throw new HTTPException(400, { message: 'Sorry, the sub task before has not ended yet' });
        }
    }

    const sqlQuery = `
        UPDATE IoT.dbo.[user_sub_tasks]
        SET started_by = @userId, started_at = GETDATE()
        WHERE uuid = @uuid;
        
        -- Update related task if this is the first sub-task and the subtask is not preparation and handle parallel tasks
        UPDATE t
        SET t.status = 'started', t.started_at = GETDATE()
        FROM IoT.dbo.[Tasks] t
        INNER JOIN IoT.dbo.[user_sub_tasks] ust ON t.Id = ust.task_id
        INNER JOIN (
            -- Get the first non-preparation sub task for comparison
            SELECT TOP 1 task_id, is_parallel, id
            FROM IoT.dbo.[user_sub_tasks]
            WHERE task_id = (SELECT task_id FROM IoT.dbo.[user_sub_tasks] WHERE uuid = @uuid)
            AND is_preparation = 0
            ORDER BY id
        ) first_sub ON first_sub.task_id = t.Id
        WHERE ust.uuid = @uuid
        AND t.started_at IS NULL
        AND ust.is_preparation = 0
        AND (
            -- Match either if it's the first sub task or if parallel status matches
            first_sub.id = ust.id
            OR first_sub.is_parallel = ust.is_parallel
        );
    `;

    return await queryDatabase(sqlQuery, { uuid, userId });
}

// Finish user sub task
export async function finishUserSubTask(c: Context, uuid: string) {
    const user = c.get('user').user;
    const userId = user.id;
    // First check if the task has started
    const userSubTask = await getUserSubTaskById(uuid);
    if (!userSubTask || userSubTask.length === 0) {
        throw new HTTPException(404, { message: 'Sub task not found' });
    }

    if (userSubTask[0].ended_at) {
        throw new HTTPException(400, { message: 'Sorry, the sub task has been ended previously' });
    }

    if (!userSubTask[0].started_at) {
        throw new HTTPException(400, { message: 'Sorry, this sub task has not started yet' });
    }


    const sqlQuery = `
        UPDATE IoT.dbo.[user_sub_tasks]
        SET  ended_at = GETDATE()
        WHERE uuid = @uuid;
        
        -- Check if this is the last sub-task and update the main task if needed
        UPDATE t
        SET t.status = 'finished', t.ended_at = GETDATE()
        FROM IoT.dbo.[Tasks] t
        INNER JOIN IoT.dbo.[user_sub_tasks] ust ON t.Id = ust.task_id
        WHERE ust.uuid = @uuid 
        AND ust.id = (select top 1 id from user_sub_tasks where task_id = t.id order by id desc)

        -- check if this is the last sub-task and return the user sub task id
        SELECT TOP 1 ust.id, t.pro, t.machine_name
        FROM IoT.dbo.[user_sub_tasks] ust
        INNER JOIN IoT.dbo.[Tasks] t ON ust.task_id = t.Id
        WHERE ust.uuid = @uuid
        AND ust.id = (select top 1 id from user_sub_tasks where task_id = t.id order by id desc)
    `;

    const result = await queryDatabase(sqlQuery, { uuid, userId });


    if (result && result.length > 0) {
        const routingParam = {
            po_name: result[0].pro,
        }
        // get routing and coois data
        const routingQuery = `
            SELECT TOP 1 c.required_qty, c.produced_qty, r.cvt, r.ct
            FROM IoT.dbo.coois c
            INNER JOIN IoT.dbo.routing r ON c.material_id = r.material_id
            WHERE c.po_name = @po_name
            order by c.id desc
        `;
        const routingData = await queryDatabase(routingQuery, routingParam);

        const countboardTaskParam = {
            po_name: result[0].pro,
            machine_name: result[0].machine_name,
            required_qty: routingData[0].required_qty,
            produced_qty: routingData[0].produced_qty,
            cvt: routingData[0].cvt,
            ct: routingData[0].ct,
        }

        // Create countboard tasks
        const countBoardTaskSql = `
            INSERT INTO IoT.dbo.countboard_tasks 
            (po_name, machine_name, required_qty, produced_qty, cvt, ct, actual_cvt, actual_ct, created_at, updated_at)
            values
            (@po_name, @machine_name, @required_qty, @produced_qty, @cvt, @ct, @cvt, @ct, GETDATE(), GETDATE())
        `;
        await queryDatabase(countBoardTaskSql, countboardTaskParam);
    }

    return;
}

// Update note for a sub task
export async function updateUserSubTaskNote(c: Context, uuid: string, note: string) {

    // validate input
    if (!uuid || uuid.trim() === '') {
        throw new HTTPException(400, { message: 'UUID cannot be empty' });
    }

    // validate user_sub_task uuid
    const userSubTask = await getUserSubTaskById(uuid);

    if (!userSubTask || userSubTask.length === 0) {
        throw new HTTPException(404, { message: 'Sub task not found' });
    }


    if (!note || note.trim() === '') {
        throw new HTTPException(400, { message: 'Note content cannot be empty' });
    }

    const sqlQuery = `
        UPDATE IoT.dbo.[user_sub_tasks]
        SET Note = @note, updated_at = GETDATE()
        WHERE uuid = @uuid
    `;
    return await queryDatabase(sqlQuery, { uuid, note });
}

// Toggle snoozed status for a sub task
export async function toggleUserSubTaskSnoozed(uuid: string) {
    const sqlQuery = `
        UPDATE IoT.dbo.[user_sub_tasks]
        SET IsSnoozed = ~IsSnoozed
        WHERE uuid = @uuid;
        
        SELECT IsSnoozed FROM IoT.dbo.[user_sub_tasks] WHERE uuid = @uuid;
    `;
    return await queryDatabase(sqlQuery, { uuid });
}

// Update additional time for a sub task
export async function updateAdditionalTime(uuid: string, additionalTime: number) {
    const sqlQuery = `
        UPDATE IoT.dbo.[user_sub_tasks]
        SET AdditionalTime = @additionalTime
        WHERE uuid = @uuid
    `;
    return await queryDatabase(sqlQuery, { uuid, additionalTime });
}

export async function invalidSuboHandler(uuid: string, taskId: number) {

    // get the Setting Mesin & Robot Subtask from the task_id
    const settingMesinRobotSubtaskQuery = `
        SELECT TOP 1 * FROM IoT.dbo.user_sub_tasks
        WHERE task_id = @task_id
        AND name like 'Setting Mesin & Robot%'
        ORDER BY id DESC
    `;
    const settingMesinRobotSubtask = await queryDatabase(settingMesinRobotSubtaskQuery, { task_id: taskId });

    if (settingMesinRobotSubtask.length === 0) {
        throw new HTTPException(400, { message: 'Setting Mesin & Robot Subtask not found' });
    }

    const settingMesinRobotSubtaskId = settingMesinRobotSubtask[0].id;

    // get the Validasi SUBO from the task_id
    const validasiSubtaskQuery = `
        SELECT TOP 1 * FROM IoT.dbo.user_sub_tasks
        WHERE task_id = @task_id
        AND name like 'Validasi SUBO%'
        ORDER BY id DESC
    `;
    const validasiSubtask = await queryDatabase(validasiSubtaskQuery, { task_id: taskId });


    if (validasiSubtask.length === 0) {
        throw new HTTPException(400, { message: 'Validasi SUBO Subtask not found' });
    }
    // check # number from the name but also handle if it's the first one
    const validasiSubtaskName = validasiSubtask[0].name;
    const validasiSubtaskNameSplit = validasiSubtaskName.split(' ');
    const validasiSubtaskNameNumber = validasiSubtaskNameSplit[validasiSubtaskNameSplit.length - 1];
    const validasiSubtaskNameNumberInt = parseInt(validasiSubtaskNameNumber.replace('#', ''));
    const validasiSubtaskNameNumberIntPlus = isNaN(validasiSubtaskNameNumberInt) ? 1 : validasiSubtaskNameNumberInt + 1;

    let uuidNew = crypto.randomUUID();

    const settingMesinRobotSubtaskParam = {
        task_id: taskId,
        uuid: uuidNew,
        role_id: settingMesinRobotSubtask[0].role_id,
        is_preparation: settingMesinRobotSubtask[0].is_preparation,
        is_parallel: settingMesinRobotSubtask[0].is_parallel,
        standard_time: settingMesinRobotSubtask[0].standard_time
    }

    const sqlQuerySettingMesinRobot = `
        INSERT INTO IoT.dbo.user_sub_tasks
        (task_id, uuid, name, is_preparation, is_parallel, role_id, standard_time, is_notif, notif_at, [index], created_at, updated_at, start_at)
        VALUES
        (@task_id, @uuid, 'Setting Mesin & Robot #${validasiSubtaskNameNumberIntPlus}', @is_preparation, @is_parallel, @role_id, @standard_time, 0, GETDATE(), 99+${validasiSubtaskNameNumberIntPlus}, GETDATE(), GETDATE(), GETDATE())
    `;
    try {
        await queryDatabase(sqlQuerySettingMesinRobot, settingMesinRobotSubtaskParam);
    } catch (error: any) {
        console.error(error);
        throw new HTTPException(500, { message: 'Failed to create new subtask : ' + error.message });
    }

    let uuidNew2 = crypto.randomUUID();

    const validasiSubtaskParam = {
        task_id: taskId,
        uuid: uuidNew2,
        role_id: validasiSubtask[0].role_id,
        is_preparation: validasiSubtask[0].is_preparation,
        is_parallel: validasiSubtask[0].is_parallel,
        standard_time: validasiSubtask[0].standard_time
    }

    const sqlQueryValidasiSubtask = `
        INSERT INTO IoT.dbo.user_sub_tasks
        (task_id, uuid, name, is_preparation, is_parallel, role_id, standard_time, is_notif, notif_at, [index], created_at, updated_at, start_at)
        VALUES
        (@task_id, @uuid, 'Validasi SUBO #${validasiSubtaskNameNumberIntPlus}', @is_preparation, @is_parallel, @role_id, @standard_time, 0, GETDATE(), 99+${validasiSubtaskNameNumberIntPlus}, GETDATE(), GETDATE(), GETDATE())
    `;
    try {
        await queryDatabase(sqlQueryValidasiSubtask, validasiSubtaskParam);
    } catch (error: any) {
        console.error(error);
        throw new HTTPException(500, { message: 'Failed to create new subtask : ' + error.message });
    }

    return true;
}