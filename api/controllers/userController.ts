import { pool } from '../config/database';

export async function fetchUsers() {
  const connection = await pool;
  const query = `
    SELECT u.id, u.username, u.firstName, u.lastName, u.createdAt, u.modifiedAt, u.createdBy, u.modifiedBy,
           ur.name as [role], ur.type, ur.process
           ,g.name as [group], l.name as [location]
           FROM IoT_APP.dbo.[User] u
    LEFT JOIN IoT_APP.dbo.UserRole ur ON ur.userId = u.id AND ur.deletedAt IS NULL
    LEFT JOIN IoT_APP.dbo.UserGroup ug ON ug.userId = u.id AND ug.deletedAt IS NULL
    LEFT JOIN IoT_APP.dbo.[Group] g on g.id = ug.groupId AND g.deletedAt  IS NULL 
    LEFT JOIN IoT_APP.dbo.UserLocation ul ON ul.userId = u.id AND ul.deletedAt IS NULL
    LEFT JOIN IoT_APP.dbo.Location l on l.id = ul.locationId  and l.deletedAt  IS NULL
    
    WHERE u.deletedAt IS NULL;
  `;

  const result = await connection.request().query(query);
  return result.recordset.map((user: { id: number; username: string; firstName: string; lastName: string; role: any; type: any; process: any; group: any; location: any; createdAt: Date; modifiedAt: Date; createdBy: string; modifiedBy: string; }) => ({
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    type: user.type,
    process: user.process,
    group: user.group,
    location: user.location,
    createdAt: user.createdAt,
    modifiedAt: user.modifiedAt,
    createdBy: user.createdBy,
    modifiedBy: user.modifiedBy,
  }));
}
