import { queryDatabase } from '@/api/utils/queryDatabase';

export async function getTasks(limit?: number, page?: number, start_at?: string, week_start_at?: string) {
    if (start_at && typeof start_at === 'string' && isNaN(Date.parse(start_at))) {
        return {
            data: null,
            messages: ['Invalid date format'],
            success: false
        };
    }


    // Convert page to offset if page is provided
    const offset = page && limit ? (page - 1) * limit : 0;
    // console.log("start_at", start_at);
    // console.log("week_start_at", week_start_at);

    const whereClause = week_start_at ? `WHERE t.start_at BETWEEN @week_start_at AND DATEADD(day, 6, @week_start_at)` : start_at ? 'WHERE CONVERT(date, t.start_at) = @date' : '';
    // Order by status desc and then by start_at to match Laravel's ordering
    const orderByClause = 'ORDER BY t.status DESC, t.start_at ASC';
    const offsetClause = offset !== undefined ? 'OFFSET @offset ROWS' : 'OFFSET 0 ROWS';
    const limitClause = limit ? 'FETCH NEXT @limit ROWS ONLY' : '';

    const sqlQuery = `
        SELECT CAST(t.id AS INT) as id, t.uuid, cast(c.material_id as int) as item_id, t.category_id, t.status, t.started_at, t.ended_at, t.start_at,
            DATEADD(second, COALESCE(SUM(ust.standard_time), 0), t.start_at) AS end_at,
                t.machine_name,
                t.is_notif,
                t.notif_at,
                t.note,
                t.created_at,
                t.updated_at,
                t.pro,
                t.pro as po_name,
                m.UAP as UAP,
                c.po_name as mold_name,
                c.material_name as item_name, tc.name as category_name, tc.name as category
        FROM tasks t
        LEFT JOIN task_categories tc ON tc.id = t.category_id
        LEFT JOIN coois c ON c.po_name = t.pro
        LEFT JOIN machinemst m on m.id = t.machine_id
        LEFT JOIN user_sub_tasks ust ON ust.task_id = t.id
        ${whereClause}
        GROUP BY t.id, t.uuid, c.material_id, t.category_id, t.status, t.started_at, t.ended_at, t.start_at, 
            t.machine_name, t.is_notif, t.notif_at, t.note, t.created_at, t.updated_at, t.pro, 
            m.UAP, c.po_name, c.material_name, tc.name
        ${orderByClause}
        ${offsetClause}
        ${limitClause}
    `;
    // console.log("SQL Query:", sqlQuery);


    const params: any = {};
    if (limit !== undefined) params.limit = limit;
    params.offset = offset;
    if (start_at) params.date = new Date(start_at);
    params.week_start_at = week_start_at ? new Date(week_start_at) : null;

    const tasks = await queryDatabase(sqlQuery, params);
    // console.log("SQL Params:", params);
    // console.log("Tasks:", tasks);

    // Format response to match Laravel's simplePaginate structure
    const currentPage = page || 1;
    const perPage = limit || 15;
    const from = tasks.length > 0 ? ((currentPage - 1) * perPage) + 1 : null;
    const to = tasks.length > 0 ? from + tasks.length - 1 : null;

    return {
        success: true,
        messages: ['success get data'],
        data: tasks,
        page: {
            current_page: currentPage,
            first_page_url: `${process.env.API_URL || ''}/api/tasks?page=1`,
            from,
            next_page_url: tasks.length === perPage ? `${process.env.API_URL || ''}/api/tasks?page=${currentPage + 1}` : null,
            path: `${process.env.API_URL || ''}/api/tasks`,
            per_page: perPage,
            prev_page_url: currentPage > 1 ? `${process.env.API_URL || ''}/api/tasks?page=${currentPage - 1}` : null,
            to
        }
    };
}

export async function getTasksByUuid(uuidString: string) {
    const isNumeric = !isNaN(parseFloat(uuidString)) && isFinite(Number(uuidString));
    const response = []
    const task = await queryDatabase(`
        SELECT cast(t.id as int) as id, t.uuid, t.category_id, c.po_name as mold_name,  t.created_at, t.updated_at, t.started_at, cast(c.id as int) as mold_id, cast(c.material_id as int) as item_id, 
        tc.name as category_name, t.machine_id, t.is_notif, t.notif_at,
        t.status, t.start_at, t.ended_at, t.machine_name, t.note, t.pro, c.material_name as item_name
        FROM tasks t
        LEFT JOIN items i ON t.item_id = i.id
        LEFT JOIN task_categories tc ON t.category_id = tc.id
        LEFT JOIN coois c ON c.po_name = t.pro
        WHERE t.uuid = @uuid OR ${isNumeric ? 't.id = @id' : '0=1'}
    `, { uuid: uuidString, ...(isNumeric ? { id: parseInt(uuidString, 10) } : {}) });

    const user_sub_tasks = await queryDatabase(`
        SELECT 
        cast(ust.id as int) as id, ust.uuid, ust.task_id, ust.sub_task_id, ust.role_id, ust.[index], ust.name, 
        ust.note, ust.is_preparation, ust.is_parallel, ust.standard_time, ust.is_snoozed, ust.is_notif,
        ust.start_at, ust.notif_at, ust.started_at, ust.ended_at, ust.created_at, ust.updated_at, 
        ust.additional_time, ust.started_by
        FROM user_sub_tasks ust
        LEFT JOIN tasks t ON ust.task_id = t.id
        WHERE t.uuid = @uuid OR ${isNumeric ? 't.id = @id' : '0=1'}
    `, { uuid: uuidString, ...(isNumeric ? { id: parseInt(uuidString, 10) } : {}) });

    const roles = await queryDatabase(`
        SELECT
        r.*
        FROM user_sub_tasks ust
        LEFT JOIN tasks t ON ust.task_id = t.id
        LEFT JOIN roles r ON ust.role_id = r.id
        WHERE t.uuid = @uuid OR ${isNumeric ? 't.id = @id' : '0=1'}
    `, { uuid: uuidString, ...(isNumeric ? { id: parseInt(uuidString, 10) } : {}) });

    const users = await queryDatabase(`
        SELECT
        u.*
        FROM user_sub_tasks ust
        LEFT JOIN tasks t ON ust.task_id = t.id
        LEFT JOIN roles r ON ust.role_id = r.id
        LEFT JOIN useraccessmst u ON r.id = u.role_id
        WHERE t.uuid = @uuid OR ${isNumeric ? 't.id = @id' : '0=1'}
    `, { uuid: uuidString, ...(isNumeric ? { id: parseInt(uuidString, 10) } : {}) });

    const user_sub_tasks_with_details = user_sub_tasks.map((user_sub_task: any) => {
        const role = roles.find((role: any) => Number(role.id) === Number(user_sub_task.role_id));
        // console.log("role", role, "role_id", user_sub_task.role_id);


        return {
            ...user_sub_task,
            // real_time: user_sub_task.started_at && user_sub_task.ended_at ?
            //     calculateRealTime(user_sub_task.started_at, user_sub_task.ended_at) : null,
            real_time: user_sub_task.started_at && user_sub_task.ended_at ? (new Date(user_sub_task.ended_at).getTime() - new Date(user_sub_task.started_at).getTime()) / 1000 : null,
            role: role ? {
                id: Number(role.id),
                name: role.name,
                display_name: role.display_name,
                users: users.filter((u: any) => u.role_id === role.id).map((u: any) => ({
                    id: Number(u.id),
                    uuid: u.uuid,
                    email: u.email,
                    role_id: Number(u.role_id),
                    user_group: u.user_group,
                    fcm_token: '',
                    user_loc: u.user_loc,
                    avatar: u.avatar,
                    name: u.name
                }))
            } : null
        };
    });

    if (task && task.length > 0) {
        const taskData = {
            ...task[0],
            // real_time: task[0].started_at && task[0].ended_at ?
            //     calculateRealTime(task[0].started_at, task[0].ended_at) : null,
            real_time: task[0].started_at && task[0].ended_at ? (new Date(task[0].ended_at).getTime() - new Date(task[0].started_at).getTime()) / 1000 : null,
            user_sub_tasks: user_sub_tasks_with_details,
        };
        response.push(taskData);
    }


    return {
        success: true,
        messages: ['success get data'],
        data: response[0] || null,
        page: []
    };
}

export async function summary(start_at: string) {
    if (start_at && isNaN(Date.parse(start_at as string))) {
        return {
            data: null,
            messages: ['Invalid date format'],
            success: false
        };
    }

    const total_finished = await queryDatabase(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE status = 'finished'
        ${start_at ? 'AND CONVERT(date, start_at) = @date' : ''}
    `, start_at ? { date: new Date(start_at) } : {});

    const real_times = await queryDatabase(`
        SELECT DATEDIFF(SECOND, started_at, ended_at) AS sql_real_time
        FROM tasks
        WHERE status = 'finished'
        ${start_at ? 'AND CONVERT(date, start_at) = @date' : ''}
    `, start_at ? { date: new Date(start_at) } : {});

    const total_time = real_times.reduce((sum: number, row: { sql_real_time: string | number }) =>
        sum + Number(row.sql_real_time), 0);

    return {
        success: true,
        messages: ['success get data'],
        data: {
            total_finished: total_finished[0].count,
            total_time: convertSecondToHourMinute(total_time)
        },
    };
}

function convertSecondToHourMinute(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}
function calculateRealTime(started_at: any, ended_at: any) {
    // Convert to Date objects if they are strings
    const start = new Date(started_at);
    const end = new Date(ended_at);

    // Calculate time difference in seconds
    const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);

    // Format the result into hours and minutes
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
}


export async function createTask(body: any) {
    // Validate required fields
    if (!body.machine_id || !body.category_id || !body.start_at || !body.pro) {
        return {
            success: false,
            messages: ['Missing required fields'],
            data: null,
            statusCode: 400
        };
    }

    try {
        // Get sub tasks for the category
        const subTasks = await queryDatabase(`
            SELECT * FROM sub_tasks 
            WHERE category_id = @category_id 
            ORDER BY id
        `, { category_id: Number(body.category_id) });

        console.log("subTasks", subTasks);

        if (!subTasks || subTasks.length === 0) {
            return {
                success: false,
                messages: ['Sub task not found'],
                data: null,
                statusCode: 400
            };
        }

        // Get machine and mold names if IDs are provided
        let machineName = null;
        if (body.machine_id) {
            const machine = await queryDatabase(`
                SELECT MchDesc as name FROM machineMST WHERE id = @machine_id
            `, { machine_id: body.machine_id });
            if (machine && machine.length > 0) {
                machineName = machine[0].name;
            }
        }

        let moldName = null;
        // if (body.mold_id) {
        //     const mold = await queryDatabase(`
        //         SELECT name FROM molds WHERE id = @mold_id
        //     `, { mold_id: body.mold_id });
        //     if (mold && mold.length > 0) {
        //         moldName = mold[0].name;
        //     }
        // }

        // Generate UUID if not provided
        const uuid = body.uuid || crypto.randomUUID();

        // Create task
        if (!body.start_at || isNaN(Date.parse(body.start_at))) {
            return {
                success: false,
                messages: ['Invalid start date format'],
                data: null,
                statusCode: 400
            };
        }

        const startAt = new Date(body.start_at);
        const notifAt = new Date(startAt);
        // Add timezone offset to handle local timezone correctly
        const timezoneOffset = startAt.getTimezoneOffset() * 60000;
        notifAt.setTime(notifAt.getTime() - timezoneOffset);
        notifAt.setMinutes(notifAt.getMinutes() - 60); // 1 hour before start time

        startAt.setTime(startAt.getTime() - timezoneOffset);

        const taskParams = {
            uuid,
            item_id: body.item_id || null,
            category_id: body.category_id,
            status: 'planned', // equivalent to Task::STATUS[0]
            start_at: startAt.toISOString(),
            machine_id: body.machine_id || null,
            machine_name: machineName,
            mold_id: body.mold_id || null,
            mold_name: moldName || null,
            notif_at: notifAt.toISOString(),
            is_notif: body.is_notif || false,
            note: body.note || null,
            pro: body.pro || null
        };

        const taskResult = await queryDatabase(`
            INSERT INTO tasks (uuid, item_id, category_id, status, start_at, machine_id, machine_name, mold_id, mold_name, notif_at, is_notif, note, pro, created_at, updated_at)
            VALUES (@uuid, @item_id, @category_id, @status, @start_at, @machine_id, @machine_name, @mold_id, @mold_name, @notif_at, @is_notif, @note, @pro, GETDATE(), GETDATE());
            SELECT SCOPE_IDENTITY() as task_id;
        `, taskParams);

        const taskId = taskResult[0].task_id;

        // Create user_sub_tasks
        let tempStandardTime = 0;
        let loop = 0;

        for (const subTask of subTasks) {
            const taskStartAt = new Date(body.start_at);
            const task_start_at = new Date(body.start_at);
            let notifAt, startAt;
            const Ustuuid = body.uuid || crypto.randomUUID();

            if (subTask.is_preparation) {
                notifAt = new Date(taskStartAt);
                const timezoneOffset = notifAt.getTimezoneOffset() * 60000;
                notifAt = new Date(notifAt.getTime() - timezoneOffset);



                notifAt.setMinutes(notifAt.getMinutes() - (subTask.standard_time || 0));

                startAt = new Date(task_start_at);
                startAt.setTime(startAt.getTime() - timezoneOffset);
                startAt.setMinutes(startAt.getMinutes() - (subTask.standard_time || 0));
            } else if (subTask.is_parallel) {
                notifAt = new Date(taskStartAt);
                const timezoneOffset = notifAt.getTimezoneOffset() * 60000;
                notifAt = new Date(notifAt.getTime() - timezoneOffset);
                notifAt.setMinutes(notifAt.getMinutes() - 5);

                startAt = new Date(task_start_at);
                startAt.setTime(startAt.getTime() - timezoneOffset);

                if (tempStandardTime < subTask.standard_time) {
                    tempStandardTime = subTask.standard_time;
                }
            } else {
                notifAt = new Date(taskStartAt);
                const timezoneOffset = notifAt.getTimezoneOffset() * 60000;
                notifAt = new Date(notifAt.getTime() - timezoneOffset);
                notifAt.setMinutes(notifAt.getMinutes() + tempStandardTime - 5);

                startAt = new Date(task_start_at);
                startAt.setTime(startAt.getTime() - timezoneOffset);
                startAt.setMinutes(startAt.getMinutes() + tempStandardTime);

                tempStandardTime += subTask.standard_time;
            }

            const userSubTaskParams = {
                uuid: Ustuuid,
                task_id: taskId,
                sub_task_id: subTask.id,
                role_id: subTask.role_id,
                index: subTask.index,
                name: subTask.name,
                is_preparation: subTask.is_preparation,
                is_parallel: subTask.is_parallel,
                standard_time: subTask.standard_time,
                start_at: startAt.toISOString(),
                notif_at: (subTask.is_preparation || loop === 0) ? notifAt.toISOString() : null
            };

            await queryDatabase(`
                INSERT INTO user_sub_tasks (uuid, task_id, sub_task_id, role_id, [index], name, is_preparation, is_parallel, standard_time, start_at, notif_at, created_at, updated_at, additional_time, started_by)
                VALUES (@uuid, @task_id, @sub_task_id, @role_id, @index, @name, @is_preparation, @is_parallel, @standard_time, @start_at, @notif_at, GETDATE(), GETDATE(), 0, 0)
            `, userSubTaskParams);

            if (!subTask.is_preparation) loop++;
        }

        // Get the created task with all its data
        const createdTask = await getTasksByUuid(uuid);

        return createdTask.data
    } catch (error: any) {
        console.error('Error creating task:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}

export async function notifyTask(body: any) {
    // Validate required fields
    if (!body.notif_type || !body.role_id || !body.user_sub_tasks_id || !body.notify_at) {
        return {
            success: false,
            messages: ['Missing required parameters'],
            data: null,
            statusCode: 400
        };
    }
    try {
        // Get the user_sub_task
        const userSubTask = await queryDatabase(`
            SELECT * FROM user_sub_tasks WHERE uuid = @user_sub_tasks_id
        `, { user_sub_tasks_id: body.user_sub_tasks_id });
        if (!userSubTask || userSubTask.length === 0) {
            return {
                success: false,
                messages: ['User sub task not found'],
                data: null,
                statusCode: 404
            };
        }
        const userSubTaskId = userSubTask[0].id;
        const taskId = userSubTask[0].task_id;
        const taskUuid = userSubTask[0].task_uuid;
        const task = await queryDatabase(`
            SELECT * FROM tasks WHERE id = @taskId
        `, { taskId });
        if (!task || task.length === 0) {
            return {
                success: false,
                messages: ['Task not found'],
                data: null,
                statusCode: 404
            };
        }

        // Create notification parameters
        const notifyDate = new Date(body.notify_at);
        notifyDate.setMinutes(notifyDate.getMinutes() + 5);

        const insertNotificationParams = {
            notif_type: body.notif_type,
            role_id: body.role_id,
            user_sub_tasks_id: body.user_sub_tasks_id,
            sub_task_name: userSubTask[0].name,
            notify_at: body.notify_at,
            message_time: notifyDate.toISOString(),
            additional_time: body.additional_time || 0,
            mold_name: task[0].mold_name,
            task_id: taskId,
            machine_name: task[0].machine_name,
        };
        const sqlQuery = `
            INSERT INTO notifications (notif_type, role_id, user_sub_tasks_id, sub_task_name, notify_at, message_time, additional_time, mold_name, task_id, machine_name, created_at, updated_at)
            VALUES (@notif_type, @role_id, @user_sub_tasks_id, @sub_task_name, @notify_at, @message_time, @additional_time, @mold_name, @task_id, @machine_name, GETDATE(), GETDATE())
        `;
        await queryDatabase(sqlQuery, insertNotificationParams);


        return {
            success: true,
            messages: ['Notification sent successfully'],
            data: null
        };
    } catch (error: any) {
        console.error('Error sending notification:', error);
        return {
            success: false,
            messages: [error.message || 'An error occurred while sending the notification'],
            data: null,
            statusCode: 500
        };
    }
}

export async function updateTask(uuid: string, body: any) {
    try {
        // First check if the task exists
        const existingTask = await queryDatabase(`
            SELECT id, status FROM tasks WHERE uuid = @uuid
        `, { uuid });

        if (!existingTask || existingTask.length === 0) {
            throw new Error('Task not found');
        }

        const taskId = existingTask[0].id;
        const taskStatus = existingTask[0].status;
        if (taskStatus !== 'planned') {
            throw new Error('Task cannot be updated because it is not in the planned status');
        }

        const existingSubTasks = await queryDatabase(`
            SELECT id, start_at FROM user_sub_tasks WHERE task_id = @taskId
        `, { taskId });

        // Build update field list
        const updateFields = [];
        const params: any = { uuid };

        // Check each field that could be updated
        if (body.category_id !== undefined) {
            updateFields.push('category_id = @category_id');
            params.category_id = body.category_id;
        }


        if (body.start_at !== undefined) {
            if (isNaN(Date.parse(body.start_at))) {
                return {
                    success: false,
                    messages: ['Invalid start date format'],
                    data: null,
                    statusCode: 400
                };
            }
            updateFields.push('start_at = @start_at');
            params.start_at = body.start_at;
        }



        if (body.machine_id !== undefined) {
            updateFields.push('machine_id = @machine_id');
            params.machine_id = body.machine_id || null;

            // Update machine_name if machine_id is provided
            if (body.machine_id) {
                const machine = await queryDatabase(`
                    SELECT name FROM machines WHERE id = @machine_id
                `, { machine_id: body.machine_id });

                if (machine && machine.length > 0) {
                    updateFields.push('machine_name = @machine_name');
                    params.machine_name = machine[0].name;
                }
            } else {
                updateFields.push('machine_name = NULL');
            }
        }

        if (body.pro !== undefined) {
            updateFields.push('pro = @pro');
            params.pro = body.pro || null;
        }

        // Add updated_at field
        updateFields.push('updated_at = GETDATE()');

        // Only proceed if there are fields to update
        if (updateFields.length > 0) {
            await queryDatabase(`
                UPDATE tasks 
                SET ${updateFields.join(', ')}
                WHERE uuid = @uuid
            `, params);
        }

        // Handle sub tasks if needed (optional based on requirements)
        if (body.user_sub_tasks && Array.isArray(body.user_sub_tasks)) {
            for (const subTask of body.user_sub_tasks) {
                if (!subTask.uuid) continue;

                const subTaskUpdateFields = [];
                const subTaskParams: any = { uuid: subTask.uuid };

                if (subTask.started_at !== undefined) {
                    subTaskUpdateFields.push('started_at = @started_at');
                    subTaskParams.started_at = subTask.started_at || null;
                }

                if (subTask.ended_at !== undefined) {
                    subTaskUpdateFields.push('ended_at = @ended_at');
                    subTaskParams.ended_at = subTask.ended_at || null;
                }

                if (subTask.is_notif !== undefined) {
                    subTaskUpdateFields.push('is_notif = @is_notif');
                    subTaskParams.is_notif = subTask.is_notif;
                }

                if (subTask.note !== undefined) {
                    subTaskUpdateFields.push('note = @note');
                    subTaskParams.note = subTask.note || null;
                }

                if (subTask.additional_time !== undefined) {
                    subTaskUpdateFields.push('additional_time = @additional_time');
                    subTaskParams.additional_time = subTask.additional_time || 0;
                }

                if (subTask.started_by !== undefined) {
                    subTaskUpdateFields.push('started_by = @started_by');
                    subTaskParams.started_by = subTask.started_by || 0;
                }

                if (subTaskUpdateFields.length > 0) {
                    subTaskUpdateFields.push('updated_at = GETDATE()');

                    await queryDatabase(`
                        UPDATE user_sub_tasks 
                        SET ${subTaskUpdateFields.join(', ')}
                        WHERE uuid = @uuid
                    `, subTaskParams);
                }
            }
        }

        // Get the updated task with all its data
        const updatedTask = await getTasksByUuid(uuid);

        return {
            success: true,
            messages: ['Task updated successfully'],
            data: updatedTask.data
        };
    } catch (error: any) {
        console.error('Error updating task:', error);
        return {
            success: false,
            messages: [error.message || 'An error occurred while updating the task'],
            data: null,
            statusCode: 500
        };
    }
}

export async function deleteTask(uuid: string) {
    try {
        // First check if the task exists
        const existingTask = await queryDatabase(`
            SELECT id, status FROM tasks WHERE uuid = @uuid
        `, { uuid });

        if (!existingTask || existingTask.length === 0) {
            throw new Error('Task not found');
        }

        const taskId = existingTask[0].id;
        const taskStatus = existingTask[0].status;
        if (taskStatus !== 'planned') {
            throw new Error('Task cannot be deleted because it is not in the planned status');
        }

        // Delete user_sub_tasks associated with the task
        await queryDatabase(`
            DELETE FROM user_sub_tasks WHERE task_id = @taskId
        `, { taskId });

        // Delete the task itself
        await queryDatabase(`
            DELETE FROM tasks WHERE uuid = @uuid
        `, { uuid });

        return {
            success: true,
            messages: ['Task deleted successfully'],
            data: null
        };
    } catch (error: any) {
        console.error('Error deleting task:', error);
        return {
            success: false,
            messages: [error.message || 'An error occurred while deleting the task'],
            data: null,
            statusCode: 500
        };
    }
}