
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';


const prisma = new PrismaClient();

export async function getTasks() {
    const tasks = await prisma.tasks.findMany({
        relationLoadStrategy: 'join',
        include: {
            items: true,
            task_categories: true,
            user_sub_tasks: {
                include: {
                    role: {
                        include: {
                            users: true
                        }
                    }
                }
            }
        }
    });

    return {
        data: tasks,
        messages: ['success get data'],
        success: true
    };
}

export async function getTasksByUuid(uuidString: string) {
    const task = await prisma.tasks.findFirst({
        where: {
            OR: [
                { uuid: uuidString },
                { id: Number.isNaN(Number(uuidString)) ? undefined : Number(uuidString) }
            ]
        },
        include: {
            items: true,
            task_categories: true,
            user_sub_tasks: {
                include: {
                    role: {
                        include: {
                            users: true
                        }
                    }
                }
            }
        }
    });
    return {
        data: task,
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

    let total_finished = await prisma.tasks.count({
        where: {
            status: 'finished',
            ...(start_at && {
                start_at: {
                    gte: new Date(start_at as string),
                    lt: new Date(new Date(start_at as string).setDate(new Date(start_at as string).getDate() + 1))
                }
            })
        }
    });

    let real_times = await prisma.$queryRaw<Prisma.Decimal[]>`
        SELECT ${Prisma.sql`TIMESTAMPDIFF(SECOND, started_at, ended_at)`} AS sql_real_time
        FROM tasks
        WHERE status = 'finished'
        ${start_at ? Prisma.sql`AND DATE(start_at) = ${new Date(start_at as string)}` : Prisma.empty}
    `;

    let total_time = real_times.reduce((sum, real_time) => sum + Number(real_time as unknown as { sql_real_time: number }), 0);

    return {
        data: {
            total_finished,
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



