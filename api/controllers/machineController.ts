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


export async function getHourlyMachine(machine_id: string, date: string | null, shift: string | null) {

  if (date !== null && shift ! == null) {
    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;

    -- Set @from and @to based on shift_id
    IF @shift = 1
    BEGIN
        SET @from = DATEADD(HOUR, 6, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 14, CAST(@date AS DATETIME));
    END
    ELSE IF @shift = 2
    BEGIN
        SET @from = DATEADD(HOUR, 14, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 22, CAST(@date AS DATETIME));
    END
    ELSE IF @shift = 3
    BEGIN
        SET @from = DATEADD(HOUR, 22, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Goes into the next day
    END

    SELECT sub.* 
    FROM (
        SELECT TOP 8
            h.id AS hourlyId,
            from_datetime,
            FORMAT(from_datetime, 'HH:mm') AS time,
            FORMAT(to_datetime, 'HH:mm') AS to_hour_minute,
            shift_id,
            c.material_id,
            ISNULL(running_target_qty, 0) AS target,
            ISNULL(running_target_qty, 0) * 0.98 AS target_tolerance,
            ISNULL(running_actual_qty, 0) AS actual,
            task_id, target_qty, actual_qty, running_actual_qty - running_target_qty AS delta, 
            hour_id, machine_id,
            c.material_id AS itemNo,
            c.material_name AS itemDesc,
            h.cause AS causes, h.note AS comments,
            h.ooe,
            h.scrap,
            h.rework
        FROM IoT.dbo.hourly h
        LEFT JOIN IoT.dbo.countboard_tasks t ON h.task_id = t.id
        OUTER APPLY (
            SELECT TOP 1 *
            FROM IoT.dbo.coois c
            WHERE t.po_name = c.po_name AND ISNULL(c.is_deleted, 0) = 0
            ORDER BY c.id DESC
        ) AS c
        WHERE machine_id = @machine_id 
          AND shift_id = @shift
          AND from_datetime BETWEEN @from AND @to
        ORDER BY from_datetime DESC
    ) AS sub
    ORDER BY CAST(hour_id AS INT) ASC;
    `
    return await queryDatabase(sqlQuery, { machine_id, date, shift });
  } else {
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
            c.material_name as itemDesc,
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
}

export async function getOeeMachine(machine_id: string, date: string | null, shift: string | null) {

  if(date !== null && shift ! == null) {
    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;

    -- Set @from and @to based on shift_id
    IF @shift = 1
    BEGIN
        SET @from = DATEADD(HOUR, 6, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 14, CAST(@date AS DATETIME));
    END
    ELSE IF @shift = 2
    BEGIN
        SET @from = DATEADD(HOUR, 14, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 22, CAST(@date AS DATETIME));
    END
    ELSE IF @shift = 3
    BEGIN
        SET @from = DATEADD(HOUR, 22, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Goes into the next day
    END;

    WITH StatusData AS (
          SELECT 
              DATEADD(HOUR, -7, s.StatusDate) AS adjustedstatusdate,
              s.StatusLight,
        s.MchID,
              CASE 
                  WHEN DATEADD(HOUR, -7, s.StatusDate) >= @from 
                  THEN DATEDIFF(SECOND,
                        DATEADD(HOUR, -7, s.StatusDate),
                        COALESCE(DATEADD(HOUR, -7, s.todate), @to)
                  ) / 3600.0
                  ELSE DATEDIFF(SECOND,
                        @from,
                        COALESCE(DATEADD(HOUR, -7, s.todate), @to)
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
                      CASE WHEN DATEADD(HOUR, -7, StatusDate) < @from THEN 1 ELSE 2 END 
                      ORDER BY StatusDate DESC
                  ) AS rnk
              FROM IoT.dbo.MchStatusTRX
              WHERE (MchID = @machine_id OR @machine_id IS NULL)  -- Allow NULL @machine_id to retrieve all machines
                AND Active = 1
                AND DATEADD(HOUR, -7, StatusDate) < @to
                AND StatusDate > '2023-04-01'
          ) s
          --JOIN MachineMST m ON m.MchID = s.MchID
          WHERE 
            (MchID = @machine_id OR @machine_id IS NULL)  -- Allow NULL @machine_id to retrieve all machines
            AND (s.rnk = 1 OR (DATEADD(HOUR, -7, s.StatusDate) BETWEEN @from AND @to))
      ),
      TimeCalculations AS (
          SELECT 
      MchID,
              DATEDIFF(SECOND, @from, @to) / 3600.0 AS timea,
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
    `
    return await queryDatabase(sqlQuery, {machine_id, date, shift})

  } else {
    const sqlQuery = `
    SELECT MchID, timea, pmidle, timeb, breakdown, timee, ooe, oee, breakdownperc, green, red, yellow, white, blue, orange, purple, grey
    FROM MachineData where MchID = @machine_id
    `;
    return await queryDatabase(sqlQuery, { machine_id });
  }

}
export async function getNooeMachine(machine_id: string, date: string | null, shift: string | null) {
  if (date !== null && shift ! == null) {
    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;

    -- Set @from and @to based on shift_id
    IF @shift = 1
    BEGIN
        SET @from = DATEADD(HOUR, 6, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 14, CAST(@date AS DATETIME));
    END
    ELSE IF @shift = 2
    BEGIN
        SET @from = DATEADD(HOUR, 14, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 22, CAST(@date AS DATETIME));
    END
    ELSE IF @shift = 3
    BEGIN
        SET @from = DATEADD(HOUR, 22, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Goes into the next day
    END

    select top 96 n.id as NooeId, h.id as hourlyId, blue, orange, purple, grey, yellow, white, red
    from IoT.dbo.nooe n
    join IoT.dbo.hourly h on n.hourly_id = h.id
    where h.machine_id = @machine_id
    and n.created_at between @from and @to
    order by hourly_id desc, n.id asc

    `
    return await queryDatabase(sqlQuery, {machine_id, date, shift})
  } else {
    const sqlQuery = `
    select top 96 n.id as NooeId, h.id as hourlyId, blue, orange, purple, grey, yellow, white, red
    from IoT.dbo.nooe n
    join IoT.dbo.hourly h on n.hourly_id = h.id
    where h.machine_id = @machine_id
    order by hourly_id desc, n.id asc
    `;
    return await queryDatabase(sqlQuery, { machine_id });
  }
}

export async function getTaskMachine(machine_name: string, date: string | null, shift: string | null) {
  if (date !== null && shift ! == null) {
    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;

    -- Set @from and @to based on shift_id
    IF @shift = 1
    BEGIN
        SET @from = DATEADD(HOUR, 6, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 14, CAST(@date AS DATETIME));
    END
    ELSE IF @shift = 2
    BEGIN
        SET @from = DATEADD(HOUR, 14, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 22, CAST(@date AS DATETIME));
    END
    ELSE IF @shift = 3
    BEGIN
        SET @from = DATEADD(HOUR, 22, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Goes into the next day
    END

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
    WHERE 
      ID = (select top 1 task_id from hourly where created_at between @from and @to)
    ORDER BY created_at DESC;
    `
    return await queryDatabase(sqlQuery, { machine_name, date, shift });
  }
  else {
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
}


