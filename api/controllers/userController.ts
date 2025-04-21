import { queryDatabase } from "../utils/queryDatabase";

export async function fetchUsers() {

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
    select * from useraccessmst where active = 1
  `;

  const result = await queryDatabase(query);
  return result
}

export async function fetchUserById(id: string) {
  const query = `
    select * from useraccessmst where id = @id and active = 1
  `;
  const result = await queryDatabase(query, { id });
  return result;
}

export async function createUser(username: string, password: string, email: string, role: string) {
  const query = `
    INSERT INTO useraccessmst (username, password, email, role)
    VALUES (@username, @password, @email, @role)
  `;
  const result = await queryDatabase(query, { username, password, email, role });
  return result;
}
export async function updateUser(id: string, username: string, password: string, email: string, role: string) {
  const query = `
    UPDATE useraccessmst
    SET username = @username, password = @password, email = @email, role = @role
    WHERE id = @id
  `;
  const result = await queryDatabase(query, { id, username, password, email, role });
  return result;
}
export async function deleteUser(id: string) {
  const query = `
    UPDATE useraccessmst
    SET active = 0
    WHERE id = @id
  `;
  const result = await queryDatabase(query, { id });
  return result;
}

export async function fetchUserByUsername(username: string) {
  const query = `
    SELECT * FROM useraccessmst WHERE username = @username AND active = 1
  `;
  const result = await queryDatabase(query, { username });
  return result;
}
