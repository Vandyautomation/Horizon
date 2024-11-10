import { queryDatabase } from '../utils/queryDatabase';

export async function getMachine() {
  const sqlQuery = `
  SELECT m.id as machineId, m.name as machineName, m.description as machineDescription, m.number as machineNumber, m.tonage as machineTonage, 
  l.id as locationId, l.name as locationName 
  FROM Machine m 
  LEFT JOIN location l on m.locationId = l.id and l.deletedAt is null
  where m.deletedAt is null
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
          task_id, target_qty, actual_qty, target_qty - actual_qty AS delta, hour_id, machine_id,
          c.material_id as itemNo,
          h.cause as causes, h.note as comments,
          h.ooe,
          h.scrap,
          h.rework
      FROM IoT_APP.dbo.hourly h
      LEFT JOIN IoT_APP.dbo.countboard_tasks t ON h.task_id = t.id
      outer APPLY (
      SELECT TOP 1 *
      FROM IoT_APP.dbo.coois c
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
  Declare @endDate datetime = GETDATE();
  Declare @startDate datetime;
  set @startDate = DATEADD(HOUR, 
    case 
      when DATEPART(HOUR, GETDATE()) between 6 and 14 then 6
      when DATEPART(HOUR, GETDATE()) between 15 and 23 then 14
      else 
        case when DATEPART(HOUR, DATEADD(DAY, -1, GETDATE())) between 6 and 14 then 6
             when DATEPART(HOUR, DATEADD(DAY, -1, GETDATE())) between 15 and 23 then 14
             else 22
        end
    end,
    CAST(CAST(GETDATE() AS date) AS datetime)
  );
  WITH StatusData AS (
        SELECT 
            DATEADD(HOUR, -7, s.StatusDate) AS adjustedstatusdate,
            s.StatusLight,
			s.MchID,
            CASE 
                WHEN DATEADD(HOUR, -7, s.StatusDate) >= @StartDate 
                THEN DATEDIFF(SECOND,
                      DATEADD(HOUR, -7, s.StatusDate),
                      COALESCE(DATEADD(HOUR, -7, s.todate), @EndDate)
                ) / 3600.0
                ELSE DATEDIFF(SECOND,
                      @StartDate,
                      COALESCE(DATEADD(HOUR, -7, s.todate), @EndDate)
                ) / 3600.0
            END AS totalhour
        FROM (
            SELECT 
                StatusDate,
                LEAD(StatusDate) OVER(
                    PARTITION BY MchID 
                    ORDER BY StatusDate
                ) AS todate,
                StatusLight,
                MchID,
                ROW_NUMBER() OVER(
                    PARTITION BY MchID, 
                    CASE WHEN DATEADD(HOUR, -7, StatusDate) < @StartDate THEN 1 ELSE 2 END 
                    ORDER BY StatusDate DESC
                ) AS rnk
            FROM MchStatusTRX
            WHERE (MchID = @machine_id OR @machine_id IS NULL)  -- Allow NULL @machine_id to retrieve all machines
              AND Active = 1
              AND DATEADD(HOUR, -7, StatusDate) < @EndDate
              AND StatusDate > '2023-04-01'
        ) s
        --JOIN MachineMST m ON m.MchID = s.MchID
        WHERE 
           (MchID = @machine_id OR @machine_id IS NULL)  -- Allow NULL @machine_id to retrieve all machines
          AND (s.rnk = 1 OR (DATEADD(HOUR, -7, s.StatusDate) BETWEEN @StartDate AND @EndDate))
    ),
    TimeCalculations AS (
        SELECT 
		MchID,
            DATEDIFF(SECOND, @StartDate, @EndDate) / 3600.0 AS timea,
            SUM(CASE WHEN StatusLight IN ('WHITE', 'BLUE') THEN totalhour ELSE 0 END) AS pmidle,
            SUM(CASE WHEN StatusLight IN ('RED', 'YELLOW', 'ORANGE', 'PURPLE', 'BLUE', 'GREY') 
                THEN totalhour ELSE 0 END) AS totalred,
            SUM(CASE WHEN StatusLight = 'GREEN' THEN totalhour ELSE 0 END) AS totalgreen,
            SUM(CASE WHEN StatusLight = 'YELLOW' THEN totalhour ELSE 0 END) AS totalyellow,
            SUM(CASE WHEN StatusLight = 'RED' THEN totalhour ELSE 0 END) AS totalred2,
            SUM(CASE WHEN StatusLight = 'BLUE' THEN totalhour ELSE 0 END) AS totalblue,
            SUM(CASE WHEN StatusLight = 'WHITE' THEN totalhour ELSE 0 END) AS totalwhite,
            SUM(CASE WHEN StatusLight = 'ORANGE' THEN totalhour ELSE 0 END) AS totalorange,
            SUM(CASE WHEN StatusLight = 'PURPLE' THEN totalhour ELSE 0 END) AS totalpurple,
            SUM(CASE WHEN StatusLight = 'GREY' THEN totalhour ELSE 0 END) AS totalgrey
        FROM StatusData
		group by MchID
    )
    SELECT 
	MchID,
        timea,
        pmidle,
        (timea - pmidle) AS timeb,
        totalred AS breakdown,
        totalgreen AS timee,
        COALESCE(totalgreen / NULLIF(timea, 0), 1) AS ooe,
        COALESCE((totalgreen + totalwhite) / NULLIF(timea, 0), 1) AS oee,
        COALESCE((totalred + totalwhite) / NULLIF(timea, 0), 0) AS breakdownperc,
        totalgreen AS green,
        totalred2 AS red,
        totalyellow AS yellow,
        totalwhite AS white,
        totalblue AS blue,
        totalorange AS orange,
        totalpurple AS purple,
        totalgrey AS grey
    FROM TimeCalculations
  `;
  return await queryDatabase(sqlQuery, { machine_id });
}

export async function getTaskMachine(machine_name: string) {
  const sqlQuery = `
  SELECT 
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
FROM IoT_APP.dbo.countboard_tasks t
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
  from IoT_APP.dbo.nooe n
  join IoT_APP.dbo.hourly h on n.hourly_id = h.id
  where h.machine_id = @machine_id
  order by hourly_id desc, n.id asc
  `;
  return await queryDatabase(sqlQuery, { machine_id });
}
