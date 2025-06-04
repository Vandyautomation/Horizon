import { Context } from 'hono';
import { queryDatabase } from '../utils/queryDatabase';



export async function loginHandler(c: Context) {

    const { username, password } = await c.req.json();

    const sqlQuery = `
    SELECT u.*, UserName as name, r.name as role_name

    FROM IoT.dbo.[UserAccessMST] u
    left join IoT.dbo.roles r on r.ID = u.role_id
    WHERE u.userRfid = @username and u.Active = 1
    `
    return await queryDatabase(sqlQuery, { username });

}
