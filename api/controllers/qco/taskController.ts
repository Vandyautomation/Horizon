import { queryDatabase } from '@/api/utils/queryDatabase';

export async function getTasks(limit?: number, offset?: number) {
    const orderByClause = (limit || offset) ? 'ORDER BY t.id' : '';
    const offsetClause = offset ? 'OFFSET @offset ROWS' : '';
    const limitClause = limit ? `${offset ? '' : 'OFFSET 0 ROWS'} FETCH NEXT @limit ROWS ONLY` : '';

    const sqlQuery = `
        SELECT CAST(t.id AS INT) as id, t.uuid, t.item_id, t.category_id, t.status, t.started_at, t.ended_at, t.start_at,
                t.machine_name,
                t.is_notif,
                t.notif_at,
                t.note,
                t.created_at,
                t.updated_at,
                t.pro,
               i.name as item_name, tc.name as category_name
        FROM tasks t
        LEFT JOIN items i ON i.id = t.item_id
        LEFT JOIN task_categories tc ON tc.id = t.category_id
        LEFT JOIN user_sub_tasks ust ON ust.task_id = t.id
        ${orderByClause}
        ${offsetClause}
        ${limitClause}
    `;

    const tasks = await queryDatabase(sqlQuery, { offset, limit });

    return {
        data: tasks,
        messages: ['success get data'],
        success: true
    };
}

export async function getTasksByUuid(uuidString: string) {
    const isNumeric = !isNaN(parseFloat(uuidString)) && isFinite(Number(uuidString));

    const task = await queryDatabase(`
        SELECT t.*, i.*, tc.*, ust.*, r.*, u.*
        FROM tasks t
        LEFT JOIN items i ON i.task_id = t.id
        LEFT JOIN task_categories tc ON tc.id = t.category_id
        LEFT JOIN user_sub_tasks ust ON ust.task_id = t.id
        LEFT JOIN roles r ON r.id = ust.role_id
        LEFT JOIN users u ON u.role_id = r.id
        WHERE t.uuid = ? OR ${isNumeric ? 't.id = ?' : 'FALSE'}
    `, [uuidString, ...(isNumeric ? [parseInt(uuidString, 10)] : [])]);

    return {
        data: task[0] || null,
        messages: ['success get data'],
        success: true
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
        data: {
            total_finished: total_finished[0].count,
            total_time: convertSecondToHourMinute(total_time)
        },
        messages: ['success get data'],
        success: true
    };
}

function convertSecondToHourMinute(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}
