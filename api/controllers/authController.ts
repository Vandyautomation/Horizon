import { Context } from 'hono';
import { queryDatabase } from '../utils/queryDatabase';



export async function loginHandler(c: Context) {

    const { username, password } = await c.req.json();

    const sqlQuery = `
    SELECT *, UserName as name FROM IoT.dbo.[UserAccessMST] WHERE userRfid = @username and Active = 1
    `
    return await queryDatabase(sqlQuery, { username });

}
