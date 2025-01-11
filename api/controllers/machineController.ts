import { queryDatabase } from '../utils/queryDatabase';

export async function getMachine() {
  const sqlQuery = `
  SELECT m.id as machineId, m.MchID as machineName, m.MchDesc as machineDescription, m.MchNumber as machineNumber, m.MchTon as machineTonage,
  m.MchLoc as locationName
  from MachineMST m
  where m.Active = 1
  order by MchLoc asc, cast(m.MchNumber as INT) asc
  `;
  return await queryDatabase(sqlQuery);
}

export async function addMachine(name: string, description: string) {
  const sqlQuery = `INSERT INTO Machine (name, description) VALUES (@name, @description)`;
  return await queryDatabase(sqlQuery, { name, description });
}


export async function getHourlyMachine(machine_id: string) {
  const sqlQuery = `
  declare @shift_id int;
  set @shift_id = case when DATEPART(HOUR, GETDATE()) between 6 and 14 then 1 when DATEPART(HOUR, GETDATE()) between 15 and 23 then 2 else 3 end
  SELECT sub.* 
  FROM (
      SELECT  top 8
          h.id as hourlyId,
          FORMAT(from_datetime, 'HH:mm') AS time,
          FORMAT(to_datetime, 'HH:mm') AS to_hour_minute,
          
          shift_id,
          c.material_id,
          ISNULL(running_target_qty, 0) AS target,
          ISNULL(running_target_qty, 0) * 0.98 AS target_tolerance,
          ISNULL(running_actual_qty, 0) AS actual,
          task_id, target_qty, actual_qty, running_actual_qty - running_target_qty AS delta, hour_id, machine_id,
          c.material_id as itemNo,
          h.cause as causes, h.note as comments,
          h.ooe,
          h.scrap,
          h.rework
      FROM IoT.dbo.hourly h
      LEFT JOIN IoT.dbo.countboard_tasks t ON h.task_id = t.id
      outer APPLY (
      SELECT TOP 1 *
      FROM IoT.dbo.coois c
      WHERE t.po_name = c.po_name AND ISNULL(c.is_deleted, 0) = 0
      ORDER BY c.id DESC
      ) AS c
      WHERE machine_id = @machine_id AND shift_id = @shift_id
    
      ORDER BY from_datetime DESC
  ) AS sub
  ORDER BY cast(hour_id as int) ASC;
  `;
  return await queryDatabase(sqlQuery, { machine_id });
}

export async function getOeeMachine(machine_id: string) {
  const sqlQuery = `
  SELECT MchID, timea, pmidle, timeb, breakdown, timee, ooe, oee, breakdownperc, green, red, yellow, white, blue, orange, purple, grey
  FROM MachineData where MchID = @machine_id
  `;
  return await queryDatabase(sqlQuery, { machine_id });
}

export async function getTaskMachine(machine_name: string) {
  const sqlQuery = `
  SELECT 
  top 1
    id, 
    po_name, 
    machine_name, 
    required_qty, 
    produced_qty, 
    cvt, 
    ct, 
    actual_cvt, 
    actual_ct, 
    cvt as target_cvt,
    ct as target_ct,
    CASE 
        WHEN (cast(required_qty as int) - cast(produced_qty as int)) > cvt * (
                (8) / (ct / 3600.0)
            )
        THEN
            FLOOR(cvt * (
                    (8) / (ct / 3600.0)
                )
            )
        ELSE 
            cast(required_qty as int) - cast(produced_qty as int)
    END AS shift_target_qty,
    created_at, 
    updated_at
FROM IoT.dbo.countboard_tasks t
WHERE po_name != '' 
    AND machine_name = @machine_name
    AND id > 29
ORDER BY created_at DESC;
  `;
  return await queryDatabase(sqlQuery, { machine_name });
}


export async function getNooeMachine(machine_id: string) {
  const sqlQuery = `
  select top 96 n.id as NooeId, h.id as hourlyId, blue, orange, purple, grey, yellow, white, red
  from IoT.dbo.nooe n
  join IoT.dbo.hourly h on n.hourly_id = h.id
  where h.machine_id = @machine_id
  order by hourly_id desc, n.id asc
  `;
  return await queryDatabase(sqlQuery, { machine_id });
}
