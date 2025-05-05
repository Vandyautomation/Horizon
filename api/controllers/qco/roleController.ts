import { queryDatabase } from "@/api/utils/queryDatabase";

export async function getRoles() {

    // const query = `
    //   SELECT u.id, u.username, u.firstName, u.lastName, u.createdAt, u.modifiedAt, u.createdBy, u.modifiedBy,
    //          ur.name as [role], ur.type, ur.process
    //          ,g.name as [group], l.name as [location]
    //          FROM IoT_APP.dbo.[User] u
    //   LEFT JOIN IoT_APP.dbo.UserRole ur ON ur.userId = u.id AND ur.deletedAt IS NULL
    //   LEFT JOIN IoT_APP.dbo.UserGroup ug ON ug.userId = u.id AND ug.deletedAt IS NULL
    //   LEFT JOIN IoT_APP.dbo.[Group] g on g.id = ug.groupId AND g.deletedAt  IS NULL 
    //   LEFT JOIN IoT_APP.dbo.UserLocation ul ON ul.userId = u.id AND ul.deletedAt IS NULL
    //   LEFT JOIN IoT_APP.dbo.Location l on l.id = ul.locationId  and l.deletedAt  IS NULL

    //   WHERE u.deletedAt IS NULL;
    // `;
    const query = `
    select * from roles
  `;

    const result = await queryDatabase(query);
    return result
}

export async function createRole(role: { name: string, display_name: string }) {
    const query = `
      INSERT INTO roles (name, display_name)
      VALUES (@name, @display_name)
    `;
    const result = await queryDatabase(query, { name: role.name, display_name: role.display_name });
    return result;
}

export async function updateRole(id: string, role: { name: string, display_name: string }) { 
    const query = `
      UPDATE roles
      SET name = @name, display_name = @display_name
      WHERE id = @id
    `;
    const result = await queryDatabase(query, { id, name: role.name, display_name: role.display_name });
    return result;
}

export async function deleteRole(id: string) {
    const query = `
      DELETE FROM roles WHERE id = @id
    `;
    const result = await queryDatabase(query, { id });
    return result;
}


