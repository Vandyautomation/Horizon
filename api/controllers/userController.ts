import { queryDatabase } from "../utils/queryDatabase";
import bcrypt from 'bcryptjs';

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
    select u.UserRFID, u.UserName, u.UserGroup, u.UserLoc, u.UserDept, u.UserUAP, u.UserTitle, r.name as role_name, r.display_name as role_display_name from useraccessmst u
    left join roles r on r.id = u.role_id
    where u.active = 1
  `;
  
  const result = await queryDatabase(query);
  delete result[0].UserHashedPassword;
  return result
}

export async function fetchUserById(id: string) {
  const query = `
    select * from useraccessmst where id = @id and active = 1
  `;
  const result = await queryDatabase(query, { id });
  return result;
}

export async function createUser(UserName: string, password: string, UserRFID: string, role_id: number, UserGroup: string, UserLoc: string, UserUAP: string, UserDept: string) {

  const passwordHash = bcrypt.hashSync(password, 10);

  const query = `
    INSERT INTO useraccessmst (username, UserHashedPassword, UserRFID, role_id, UserGroup, UserLoc, UserUAP, UserDept, UserTitle, active)
    VALUES (@UserName, @passwordHash, @UserRFID, @role_id, @UserGroup, @UserLoc, @UserUAP, @UserDept, @UserDept, 1)
  `;
  const result = await queryDatabase(query, { UserName, passwordHash, UserRFID, role_id, UserGroup, UserLoc, UserUAP, UserDept });
  return result;
}
export async function updateUser(id: string, UserName: string, UserRFID: string, role_id: number, UserGroup: string, UserLoc: string, UserDept: string, UserUAP: string) {
  const query = `
    UPDATE useraccessmst
    SET UserName = @UserName, UserRFID = @UserRFID, role_id = @role_id, UserGroup = @UserGroup, UserLoc = @UserLoc, UserDept = @UserDept, UserUAP = @UserUAP
    WHERE id = @id
  `;
  const result = await queryDatabase(query, { id, UserName, UserRFID, role_id, UserGroup, UserLoc, UserDept, UserUAP });
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

export async function fetchUserByNik(nik: string) {
  const query = `
    SELECT * FROM useraccessmst WHERE UserRFID = @nik AND active = 1
  `;
  const result = await queryDatabase(query, { nik });
  return result;
}
