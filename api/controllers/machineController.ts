import { queryDatabase } from '../utils/queryDatabase';

export async function updateMachine(machineId: string, machineDescription: string, machineTonage: string, machineLocation: string, machineProcess: string, machineUap: string, machineEquipment: string, position: string, rotation: string) {
let sqlQuery = `
    UPDATE MachineMST
    SET 
    MchDesc = @machineDescription,
    MchTon = @machineTonage,
    MchLoc = @machineLocation,
    MchProcess = @machineProcess,
    UAP = @machineUap,
    position = @position,
    rotation = @rotation
    WHERE MchID = @machineId;`
    
    // Check if machineEquipment exists before splitting
    const equipment = machineEquipment ? machineEquipment.split(',') : [];

    if (equipment.length === 0) {
        sqlQuery += `
        UPDATE MachineEquipmentMST 
        SET Active = 0, modified_at = GETDATE()
        WHERE MchID = @machineId`;
    } else {
        for (let i = 0; i < equipment.length; i++) {
        // Extract the current equipment item
            const currentEquipment = equipment[i].trim();
            
            sqlQuery += `
            MERGE MachineEquipmentMST AS target
            USING (SELECT @machineId AS MchID, '${currentEquipment}' AS EquipmentID) AS source
            ON (target.MchID = source.MchID AND target.EquipmentID = source.EquipmentID)
            WHEN MATCHED THEN 
                    UPDATE SET Active = 1
            WHEN NOT MATCHED THEN
                    INSERT (MchID, EquipmentID, Active, created_at) VALUES (source.MchID, source.EquipmentID, 1, getdate());
            `;

            if (i === equipment.length - 1) {
                // After processing all equipment items, set Active=0 for any equipment not in the payload
                sqlQuery += `
                UPDATE MachineEquipmentMST 
                SET Active = 0, modified_at = GETDATE()
                WHERE MchID = @machineId
                AND EquipmentID NOT IN (${equipment.map(e => `'${e.trim()}'`).join(',')});
                `;
            }
        } 
    }
    

  return await queryDatabase(sqlQuery, {machineId, machineDescription, machineTonage, machineLocation, machineProcess, machineUap, machineEquipment, position, rotation});
}

export async function getChangeState(machine_name: string, date: string | null, shift: string | null) {
    if(date && shift){
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
        ELSE
        BEGIN
            SET @from = DATEADD(HOUR, 22, CAST(@date AS DATETIME)); 
            SET @to = DATEADD(HOUR, 6, CAST(@date AS DATETIME));
        END  
    
        SELECT ID, Dateadd(hour,-7,StatusDate) as AdjustedStatusDate, StatusLight as Color
        from IoT.dbo.MchStatusTRX with (nolock)
        Where MchID = @machine_name  and Active = 1
        and Dateadd(hour,-7,StatusDate) between @from and @to
  

        UNION ALL

        SELECT TOP 1 ID, @from as AdjustedStatusDate, StatusLight as Color
        from IoT.dbo.MchStatusTRX with (nolock)
        Where MchID = @machine_name
        and Dateadd(hour,-7,StatusDate) < @from  and Active = 1
        order by AdjustedStatusDate DESC
        `;
        return await queryDatabase(sqlQuery, {machine_name, date, shift});
    } else {
        const sqlQuery = `
        DECLARE @from DATETIME;
        DECLARE @to DATETIME;
        DECLARE @shift int;
    
        set @shift = case when DATEPART(HOUR, GETDATE()) between 5 and 13 then 1 when DATEPART(HOUR, GETDATE()) between 14 and 22 then 2 else 3 end

        -- Set @from and @to based on shift_id
        IF @shift = 1
        BEGIN
            SET @from = DATEADD(HOUR, 6, cast(CAST(GETDATE() AS date)as datetime)); 
            SET @to = DATEADD(HOUR, 14, cast(CAST(GETDATE() AS date)as datetime));
        END
        ELSE IF @shift = 2
        BEGIN
            SET @from = DATEADD(HOUR, 14,cast(CAST(GETDATE() AS date)as datetime)) 
            SET @to = DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
        END
        ELSE IF @shift = 3
        BEGIN
            SET @from = DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
            SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime))); -- Goes into the next day
        END
    

        SELECT ID, Dateadd(hour,-7,StatusDate) as AdjustedStatusDate, StatusLight as Color
        from IoT.dbo.MchStatusTRX with (nolock)
        Where MchID = @machine_name and Active = 1
        and Dateadd(hour,-7,StatusDate) between @from and @to
  

        UNION ALL

        SELECT TOP 1 ID, @from as AdjustedStatusDate, StatusLight as Color
        from IoT.dbo.MchStatusTRX with (nolock)
        Where MchID = @machine_name
        and Dateadd(hour,-7,StatusDate) < @from  and Active = 1
        order by AdjustedStatusDate DESC
        `;
        return await queryDatabase(sqlQuery, {machine_name});

    }
    
  }

export async function getMachine(type: string | null) {
  const sqlQuery = `
  SELECT 
    m.id as machineId, 
    m.MchID as machineName, 
    m.MchDesc as machineDescription, 
    m.MchNumber as machineNumber, 
    m.MchTon as machineTonage,
    m.MchLoc as locationName,
    m.position, 
    m.rotation, 
    m.MchProcess as Process, 
    m.uap, 
    STRING_AGG(em.EquipmentID, ', ') AS equipment,  -- Concatenates multiple EquipmentIDs
    m.MchTon as tonage
FROM IoT.dbo.MachineMST m
LEFT JOIN IoT.dbo.MachineEquipmentMST em ON m.MchID = em.MchID and em.Active = 1
WHERE 
    m.Active = 1 
    AND m.MchLoc IS NOT NULL 
    AND m.MchLoc != 'Mixing Bld T'
GROUP BY 
    m.id, m.MchID, m.MchDesc, m.MchNumber, m.MchTon, 
    m.MchLoc, m.position, m.rotation, m.MchProcess, m.uap
ORDER BY 
    m.MchLoc ASC, CAST(m.MchNumber AS INT) ASC;

  `;
  return await queryDatabase(sqlQuery, {type});
}

export async function getSpindle(machine_id: string, date: string | null, shift: string | null) {
  if(date && shift){
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
    ELSE
    BEGIN
        SET @from = DATEADD(HOUR, 22, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 6, CAST(@date AS DATETIME));
    END  

    SELECT top 1 s.SpindleSTD, d.highestCountSpindleInCurrentCycle as SpindleACT
    from Machine_UV_STD s
    join UV_CountingData d on d.MchID = s.MchID-- and d.CREATED_AT between @from and @to
    where s.Active = 1 and s.MchID = @machine_id
    
    `

    return await queryDatabase(sqlQuery, {machine_id, date, shift});
  }
  else {const sqlQuery = `
  SELECT top 1 s.SpindleSTD, d.highestCountSpindleInCurrentCycle as SpindleACT
  from Machine_UV_STD s
  join UV_CountingData d on d.MchID = s.MchID
  where s.Active = 1 and s.MchID = @machine_id
  `;
  return await queryDatabase(sqlQuery, {machine_id, date, shift});
  }
}

export async function addMachine(name: string, description: string) {
  const sqlQuery = `INSERT INTO Machine (name, description) VALUES (@name, @description)`;
  return await queryDatabase(sqlQuery, { name, description });
}


export async function getHourlyMachine(machine_id: string, date: string | null, shift: string | null, type: string | null) {
  if(type === 'uv'){
    if(date && shift){
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
              ISNULL(running_actual_in_qty, 0) AS actual_in,
              ISNULL(running_actual_in_qty, 0) - ISNULL(running_actual_out_qty, 0) AS gap,
              task_id, target_qty, actual_qty, ISNULL(running_actual_qty,0) - ISNULL(running_target_qty,0) AS delta, 
              hour_id, machine_id,
              c.material_id AS itemNo,
              c.material_name AS itemDesc,
              h.cause AS causes, h.note AS comments,
              h.ooe,
              h.reject_a,
              h.reject_b,
              h.reject_c,
              h.reject_d,
              h.reject_e,
              isnull(rA.name,'') as reject_a_name,
              isnull(rB.name,'') as reject_d_name,
              isnull(rC.name,'') as reject_c_name,
              isnull(rD.name,'') as reject_b_name,
              isnull(rE.name,'') as reject_e_name,
              h.process

          FROM IoT.dbo.hourly_uv h
          LEFT JOIN IoT.dbo.RejectMST rA on h.reject_a_id = rA.id
          LEFT JOIN IoT.dbo.RejectMST rB on h.reject_b_id = rB.id
          LEFT JOIN IoT.dbo.RejectMST rC on h.reject_c_id = rC.id
          LEFT JOIN IoT.dbo.RejectMST rD on h.reject_d_id = rD.id
          LEFT JOIN IoT.dbo.RejectMST rE on h.reject_e_id = rE.id
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
      set @shift_id = case when DATEPART(HOUR, GETDATE()) between 5 and 13 then 1 when DATEPART(HOUR, GETDATE()) between 14 and 22 then 2 else 3 end
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
              ISNULL(running_actual_in_qty, 0) AS actual_in,
              ISNULL(running_actual_in_qty, 0) - ISNULL(running_actual_out_qty, 0) AS gap,
              task_id, target_qty, actual_qty, ISNULL(running_actual_qty,0) - ISNULL(running_target_qty,0) AS delta, 
              hour_id, machine_id,
              c.material_id as itemNo,
              c.material_name as itemDesc,
              h.cause as causes, h.note as comments,
              h.ooe,
              h.reject_a,
              h.reject_b,
              h.reject_c,
              h.reject_d,
              h.reject_e,
              isnull(rA.name,'') as reject_a_name,
              isnull(rB.name,'') as reject_b_name,
              isnull(rC.name,'') as reject_c_name,
              isnull(rD.name,'') as reject_d_name,
              isnull(rE.name,'') as reject_e_name,
              h.process
          FROM IoT.dbo.hourly_uv h
          LEFT JOIN IoT.dbo.RejectMST rA on h.reject_a_id = rA.id
          LEFT JOIN IoT.dbo.RejectMST rB on h.reject_b_id = rB.id
          LEFT JOIN IoT.dbo.RejectMST rC on h.reject_c_id = rC.id
          LEFT JOIN IoT.dbo.RejectMST rD on h.reject_d_id = rD.id
          LEFT JOIN IoT.dbo.RejectMST rE on h.reject_e_id = rE.id
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
  } else if( type === 'injection'){
    if(date && shift){
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
              task_id, target_qty, actual_qty, ISNULL(running_actual_qty,0) - ISNULL(running_target_qty,0) AS delta, 
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
      set @shift_id = case when DATEPART(HOUR, GETDATE()) between 5 and 13 then 1 when DATEPART(HOUR, GETDATE()) between 14 and 22 then 2 else 3 end
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
              task_id, target_qty, actual_qty, ISNULL(running_actual_qty,0) - ISNULL(running_target_qty,0) AS delta, 
              hour_id, machine_id,
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
}

export async function getOeeMachine(machine_id: string, date: string | null, shift: string | null) {
  if(date && shift){
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
                  WHEN s.StatusDate >= @from 
                  THEN DATEDIFF(SECOND,
                        s.StatusDate,
                        COALESCE(s.todate, @to)
                  ) / 3600.0
                  ELSE DATEDIFF(SECOND,
                        @from,
                        COALESCE(s.todate, @to)
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
                      CASE WHEN StatusDate < @from THEN 1 ELSE 2 END 
                      ORDER BY StatusDate DESC
                  ) AS rnk
              FROM IoT.dbo.MchStatusTRX
              WHERE MchID = @machine_id 
                AND Active = 1
                AND StatusDate < @to
                AND StatusDate > '2023-04-01'
          ) s
          --JOIN MachineMST m ON m.MchID = s.MchID
          WHERE 
          s.rnk = 1 OR  s.StatusDate BETWEEN @from AND @to
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
export async function getNooeMachine(machine_id: string, date: string | null, shift: string | null, ems: boolean | null) {
  if(date && shift){ // HISTORY COUNTBOARD

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
        n.id AS NooeId, 
        h.id AS hourlyId, 
        n.blue, n.orange, n.purple, n.grey, n.yellow, n.white, n.red
        , CASE 
        WHEN COALESCE(n.blue, n.orange, n.purple, n.grey, n.yellow, n.white, n.red) IS NULL 
        THEN 1 ELSE NULL 
        END AS green
        ,n.created_at as fromTime
    FROM IoT.dbo.nooe n WITH (NOLOCK)
    JOIN IoT.dbo.hourly h WITH (NOLOCK) 
        ON n.hourly_id = h.id
    WHERE h.machine_id = @machine_id
    AND h.from_datetime BETWEEN @from AND @to


    `
    return await queryDatabase(sqlQuery, {machine_id, date, shift})
  } else if(ems && !date){ // LIVE EMS

    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;

        SET @from =DATEADD(HOUR, 0,cast(CAST(GETDATE() AS date)as datetime)) ; 
        SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime)));; -- Goes into the next day


        SELECT 
            n.id AS NooeId, 
            h.id AS hourlyId, 
            n.blue, n.orange, n.purple, n.grey, n.yellow, n.white, n.red,
            
            -- Green flag logic
            CASE 
                WHEN 
                    COALESCE(n.blue, n.orange, n.purple, n.grey, n.yellow, n.white, n.red) IS NULL 
                    AND DATEADD(
                        MINUTE, 
                        CASE 
                            WHEN five_minutes_id = 1 THEN 0
                            WHEN five_minutes_id = 2 THEN 5
                            WHEN five_minutes_id = 3 THEN 10  
                            WHEN five_minutes_id = 4 THEN 15  
                            WHEN five_minutes_id = 5 THEN 20  
                            WHEN five_minutes_id = 6 THEN 25  
                            WHEN five_minutes_id = 7 THEN 30  
                            WHEN five_minutes_id = 8 THEN 35  
                            WHEN five_minutes_id = 9 THEN 40  
                            WHEN five_minutes_id = 10 THEN 45  
                            WHEN five_minutes_id = 11 THEN 50  
                            WHEN five_minutes_id = 12 THEN 55  
                            ELSE 0  -- Default case
                        END, 
                        h.from_datetime
                    ) < DATEADD(MINUTE, -5, GETDATE())  -- Ensuring fromTime is older than 5 minutes
                THEN 1 ELSE NULL 
            END AS green,

            five_minutes_id,
            h.from_datetime,
            
            -- Calculate fromTime based on five_minutes_id
            DATEADD(
                MINUTE, 
                CASE 
                    WHEN five_minutes_id = 1 THEN 0
                    WHEN five_minutes_id = 2 THEN 5
                    WHEN five_minutes_id = 3 THEN 10  
                    WHEN five_minutes_id = 4 THEN 15  
                    WHEN five_minutes_id = 5 THEN 20  
                    WHEN five_minutes_id = 6 THEN 25  
                    WHEN five_minutes_id = 7 THEN 30  
                    WHEN five_minutes_id = 8 THEN 35  
                    WHEN five_minutes_id = 9 THEN 40  
                    WHEN five_minutes_id = 10 THEN 45  
                    WHEN five_minutes_id = 11 THEN 50  
                    WHEN five_minutes_id = 12 THEN 55  
                    ELSE 0  -- Default case
                END, 
                h.from_datetime
            ) AS fromTime
        FROM IoT.dbo.nooe n WITH (NOLOCK)
        JOIN IoT.dbo.hourly h WITH (NOLOCK) 
            ON n.hourly_id = h.id
        WHERE h.machine_id = @machine_id
        AND h.from_datetime >= @from 
        AND h.from_datetime <= @to;
    `
    return await queryDatabase(sqlQuery, {machine_id, date, shift})
  } else if(date && ems){ // HISTORY EMS

    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;


    SET @from = DATEADD(HOUR, 0, cast(CAST(@date AS date)as datetime))
    SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, cast(CAST(@date AS date)as datetime))); -- Goes into the next day


    SELECT 
        n.id AS NooeId, 
        h.id AS hourlyId, 
        n.blue, n.orange, n.purple, n.grey, n.yellow, n.white, n.red,
        
        -- Green flag logic
        CASE 
            WHEN 
                COALESCE(n.blue, n.orange, n.purple, n.grey, n.yellow, n.white, n.red) IS NULL 
                AND DATEADD(
                    MINUTE, 
                    CASE 
                        WHEN five_minutes_id = 1 THEN 0
                        WHEN five_minutes_id = 2 THEN 5
                        WHEN five_minutes_id = 3 THEN 10  
                        WHEN five_minutes_id = 4 THEN 15  
                        WHEN five_minutes_id = 5 THEN 20  
                        WHEN five_minutes_id = 6 THEN 25  
                        WHEN five_minutes_id = 7 THEN 30  
                        WHEN five_minutes_id = 8 THEN 35  
                        WHEN five_minutes_id = 9 THEN 40  
                        WHEN five_minutes_id = 10 THEN 45  
                        WHEN five_minutes_id = 11 THEN 50  
                        WHEN five_minutes_id = 12 THEN 55  
                        ELSE 0  -- Default case
                    END, 
                    h.from_datetime
                ) < DATEADD(MINUTE, -5, GETDATE())  -- Ensuring fromTime is older than 5 minutes
            THEN 1 ELSE NULL 
        END AS green,

        five_minutes_id,
        h.from_datetime,
        
        -- Calculate fromTime based on five_minutes_id
        DATEADD(
            MINUTE, 
            CASE 
                WHEN five_minutes_id = 1 THEN 0
                WHEN five_minutes_id = 2 THEN 5
                WHEN five_minutes_id = 3 THEN 10  
                WHEN five_minutes_id = 4 THEN 15  
                WHEN five_minutes_id = 5 THEN 20  
                WHEN five_minutes_id = 6 THEN 25  
                WHEN five_minutes_id = 7 THEN 30  
                WHEN five_minutes_id = 8 THEN 35  
                WHEN five_minutes_id = 9 THEN 40  
                WHEN five_minutes_id = 10 THEN 45  
                WHEN five_minutes_id = 11 THEN 50  
                WHEN five_minutes_id = 12 THEN 55  
                ELSE 0  -- Default case
            END, 
            h.from_datetime
        ) AS fromTime
    FROM IoT.dbo.nooe n WITH (NOLOCK)
    JOIN IoT.dbo.hourly h WITH (NOLOCK) 
        ON n.hourly_id = h.id
    WHERE h.machine_id = @machine_id
    AND h.from_datetime >= @from 
    AND h.from_datetime <= @to;

    `
    return await queryDatabase(sqlQuery, {machine_id, date, shift})
  } else { // LIVE COUNTBOARD


    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;
    DECLARE @shift int;
    set @shift = case when DATEPART(HOUR, GETDATE()) between 5 and 13 then 1 when DATEPART(HOUR, GETDATE()) between 14 and 22 then 2 else 3 end

    -- Set @from and @to based on shift_id
    IF @shift = 1
    BEGIN
        SET @from = DATEADD(HOUR, 6, cast(CAST(GETDATE() AS date)as datetime)); 
        SET @to = DATEADD(HOUR, 14, cast(CAST(GETDATE() AS date)as datetime));
    END
    ELSE IF @shift = 2
    BEGIN
        SET @from = DATEADD(HOUR, 14,cast(CAST(GETDATE() AS date)as datetime)) 
        SET @to = DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
    END
    ELSE IF @shift = 3
    BEGIN
        SET @from = DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
        SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime))); -- Goes into the next day
    END

        SELECT 
        n.id AS NooeId, 
        h.id AS hourlyId, 
        n.blue, n.orange, n.purple, n.grey, n.yellow, n.white, n.red
        , CASE 
        WHEN COALESCE(n.blue, n.orange, n.purple, n.grey, n.yellow, n.white, n.red) IS NULL 
        THEN 1 ELSE NULL 
        END AS green
        ,n.created_at as fromTime
    FROM IoT.dbo.nooe n WITH (NOLOCK)
    JOIN IoT.dbo.hourly h WITH (NOLOCK) 
        ON n.hourly_id = h.id
    WHERE h.machine_id = @machine_id
    AND h.from_datetime BETWEEN @from AND @to

    `;
    return await queryDatabase(sqlQuery, { machine_id });
  }
}

export async function getTaskMachine(machine_name: string, date: string | null, shift: string | null) {
  if(date && shift){
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
     ID = (select top 1 task_id from IoT.dbo.hourly h 
      join IoT.dbo.MachineMST mm on mm.MchID = h.machine_id
      where from_datetime between @from and @to 
      and mm.MchDesc = @machine_name)
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



export async function getEnergyMachineDaily(machine_name: string, date: string | null) {
    if(date){
      const sqlQuery = `
      DECLARE @from DATETIME;
      DECLARE @to DATETIME;
  
        SET @from = DATEADD(HOUR, 0, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Goes into the next day

    
        WITH HourlyReadings AS (
            SELECT 
                DATEPART(YEAR, PMDT) AS Year,
                DATEPART(MONTH, PMDT) AS Month,
                DATEPART(DAY, PMDT) AS Day,
                DATEPART(HOUR, PMDT) AS Hour,
                MIN(PMDT) AS EarliestPMDT,
                LEAD(MIN(PMDT)) OVER (PARTITION BY DATEPART(YEAR, PMDT), DATEPART(MONTH, PMDT), DATEPART(DAY, PMDT) ORDER BY DATEPART(HOUR, PMDT)) AS LatestPMDT
            FROM eEnergy.dbo.PowerMeter
            WHERE 
                TrxType = 'Automatic' AND MchID = @machine_name
                AND active = 1 AND PMType = 'ENERGY'
                AND PMDT BETWEEN @from AND @to
            GROUP BY 
                DATEPART(YEAR, PMDT),
                DATEPART(MONTH, PMDT),
                DATEPART(DAY, PMDT),
                DATEPART(HOUR, PMDT)
        )
        ,EnergyData AS (
            SELECT 
                h.Year, h.Month, h.Day, 
                FORMAT(DATEADD(HOUR, h.Hour, '1900-01-01'), 'HH:00') AS hour,
                e1.PMValue AS StartEnergy,
                e2.PMValue AS EndEnergy,
                e2.PMValue - e1.PMValue AS consumption,
                e1.MchID
            FROM HourlyReadings h
            JOIN eEnergy.dbo.PowerMeter e1 ON e1.PMDT = h.EarliestPMDT AND e1.MchID = @machine_name
            JOIN eEnergy.dbo.PowerMeter e2 ON e2.PMDT = h.LatestPMDT AND e2.MchID = @machine_name
            WHERE h.LatestPMDT IS NOT NULL  -- Avoid NULL joins for the last hour
        )
        SELECT * FROM EnergyData 
        ORDER BY Year DESC, Month DESC, Day DESC, Hour DESC;

      `
      return await queryDatabase(sqlQuery, { machine_name, date });
    }
    else {
      const sqlQuery = `
      
     DECLARE @from DATETIME;
      DECLARE @to DATETIME;
  
        SET @from =DATEADD(HOUR, 0,cast(CAST(GETDATE() AS date)as datetime)) ; 
        SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime)));; -- Goes into the next day

    
    WITH HourlyReadings AS (
        SELECT 
            DATEPART(YEAR, PMDT) AS Year,
            DATEPART(MONTH, PMDT) AS Month,
            DATEPART(DAY, PMDT) AS Day,
            DATEPART(HOUR, PMDT) AS Hour,
            MIN(PMDT) AS EarliestPMDT,
            LEAD(MIN(PMDT)) OVER (PARTITION BY DATEPART(YEAR, PMDT), DATEPART(MONTH, PMDT), DATEPART(DAY, PMDT) ORDER BY DATEPART(HOUR, PMDT)) AS LatestPMDT
        FROM eEnergy.dbo.PowerMeter
        WHERE 
            TrxType = 'Automatic' AND MchID = @machine_name
            AND active = 1 AND PMType = 'ENERGY'
            AND PMDT BETWEEN @from AND @to
        GROUP BY 
            DATEPART(YEAR, PMDT),
            DATEPART(MONTH, PMDT),
            DATEPART(DAY, PMDT),
            DATEPART(HOUR, PMDT)
    )
    ,EnergyData AS (
        SELECT 
            h.Year, h.Month, h.Day, 
            FORMAT(DATEADD(HOUR, h.Hour, '1900-01-01'), 'HH:00') AS hour,
            e1.PMValue AS StartEnergy,
            e2.PMValue AS EndEnergy,
            e2.PMValue - e1.PMValue AS consumption,
            e1.MchID
        FROM HourlyReadings h
        JOIN eEnergy.dbo.PowerMeter e1 ON e1.PMDT = h.EarliestPMDT AND e1.MchID = @machine_name
        JOIN eEnergy.dbo.PowerMeter e2 ON e2.PMDT = h.LatestPMDT AND e2.MchID = @machine_name
        WHERE h.LatestPMDT IS NOT NULL  -- Avoid NULL joins for the last hour
    )
    SELECT * FROM EnergyData 
    ORDER BY Year DESC, Month DESC, Day DESC, Hour DESC;

      `;
      return await queryDatabase(sqlQuery, { machine_name });
    }
  }




  export async function getEnergyStatusLightMachineDaily(machine_name: string, date: string | null) {
    if(date){
      const sqlQuery = `
      DECLARE @from DATETIME;
      DECLARE @to DATETIME;
  
        SET @from = DATEADD(HOUR, 0, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Goes into the next day

        WITH StatusWithDuration AS (
            SELECT 
                StatusLight,
                StatusLightBefore, 
                PMDT,
                LAG(PMDT) OVER (PARTITION BY MchID ORDER BY PMDT) AS BeforePMDT,
                valueUsed
            FROM eEnergy.dbo.PowerMeter with (nolock)
            WHERE 
                TrxType = 'Manual'
                AND MchID = @machine_name
                AND Active = 1
                AND PMDT between @from and @to
        )

        SELECT 
            StatusLightBefore,
            SUM(valueUsed) AS TotalEnergyUsed,
            SUM(CAST(DATEDIFF(SECOND, BeforePMDT, PMDT) AS FLOAT) / 3600) AS DurationHours
        FROM StatusWithDuration with (nolock)
        WHERE BeforePMDT IS NOT NULL
        GROUP BY StatusLightBefore
        ORDER BY MIN(PMDT);
    
      `
      return await queryDatabase(sqlQuery, { machine_name, date });
    }
    else {
      const sqlQuery = `
      DECLARE @from DATETIME;
      DECLARE @to DATETIME;
  
        SET @from =DATEADD(HOUR, 0,cast(CAST(GETDATE() AS date)as datetime)) ; 
        SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime))); -- Goes into the next day

    
        WITH StatusWithDuration AS (
            SELECT 
                StatusLight,
                StatusLightBefore, 
                PMDT,
                LAG(PMDT) OVER (PARTITION BY MchID ORDER BY PMDT) AS BeforePMDT,
                valueUsed
            FROM eEnergy.dbo.PowerMeter with (nolock)
            WHERE 
                TrxType = 'Manual'
                AND MchID = @machine_name
                AND Active = 1
                AND PMDT between @from and @to
        )

        SELECT 
            StatusLightBefore,
            SUM(valueUsed) AS TotalEnergyUsed,
            SUM(CAST(DATEDIFF(SECOND, BeforePMDT, PMDT) AS FLOAT) / 3600) AS DurationHours
        FROM StatusWithDuration with (nolock)
        WHERE BeforePMDT IS NOT NULL
        GROUP BY StatusLightBefore
        ORDER BY MIN(PMDT);
      `;
      return await queryDatabase(sqlQuery, { machine_name });
    }
  }

  export async function getEnergyAdditionalData(machine_name: string, date: string | null) {
    if(date){
      const sqlQuery = `
      DECLARE @from DATETIME;
      DECLARE @to DATETIME;
  
      SET @from = DATEADD(HOUR, 0, CAST(@date AS DATETIME)); 
      SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Goes into the next day

        WITH StatusData AS (
                SELECT 
                    DATEADD(HOUR, -7, s.StatusDate) AS adjustedstatusdate,
                    s.StatusLight,
                s.MchID,
                    CASE 
                        WHEN s.StatusDate >= @from 
                        THEN DATEDIFF(SECOND,
                                s.StatusDate,
                                COALESCE(s.todate, @to)
                        ) / 3600.0
                        ELSE DATEDIFF(SECOND,
                                @from,
                                COALESCE(s.todate, @to)
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
                            CASE WHEN StatusDate < @from THEN 1 ELSE 2 END 
                            ORDER BY StatusDate DESC
                        ) AS rnk
                    FROM IoT.dbo.MchStatusTRX
                    WHERE MchID = @machine_name 
                        AND Active = 1
                        AND StatusDate < @to
                        AND StatusDate > '2023-04-01'
                ) s
                --JOIN MachineMST m ON m.MchID = s.MchID
                WHERE 
                s.rnk = 1 OR  s.StatusDate BETWEEN @from AND @to
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

        SELECT TOP 1 
            statusLight
            ,COALESCE(totalgreen / NULLIF(timea, 0), 1) AS ooe
            ,COALESCE((totalgreen + totalwhite) / NULLIF(timea, 0), 0) AS oee
            , case when @machine_name = 'MT280100' then 7300 
            when @machine_name = 'JW220004' then 10300
            else 0
            end as budgetEnergyPerJam
        FROM IoT.dbo.mchstatustrx t
        CROSS JOIN TimeCalculations
        WHERE t.MchID = @machine_name  
        ORDER BY t.ID DESC;


    
      `
      return await queryDatabase(sqlQuery, { machine_name, date });
    }
    else {
      const sqlQuery = `
      
     DECLARE @from DATETIME;
      DECLARE @to DATETIME;
  
        SET @from =DATEADD(HOUR, 0,cast(CAST(GETDATE() AS date)as datetime)) ; 
        SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime)));; -- Goes into the next day

        WITH StatusData AS (
                SELECT 
                    DATEADD(HOUR, -7, s.StatusDate) AS adjustedstatusdate,
                    s.StatusLight,
                s.MchID,
                    CASE 
                        WHEN s.StatusDate >= @from 
                        THEN DATEDIFF(SECOND,
                                s.StatusDate,
                                COALESCE(s.todate, @to)
                        ) / 3600.0
                        ELSE DATEDIFF(SECOND,
                                @from,
                                COALESCE(s.todate, @to)
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
                            CASE WHEN StatusDate < @from THEN 1 ELSE 2 END 
                            ORDER BY StatusDate DESC
                        ) AS rnk
                    FROM IoT.dbo.MchStatusTRX
                    WHERE MchID = @machine_name 
                        AND Active = 1
                        AND StatusDate < @to
                        AND StatusDate > '2023-04-01'
                ) s
                --JOIN MachineMST m ON m.MchID = s.MchID
                WHERE 
                s.rnk = 1 OR  s.StatusDate BETWEEN @from AND @to
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

        SELECT TOP 1 
            statusLight
            ,COALESCE((totalgreen + totalwhite) / NULLIF(timea, 0), 0) AS oee,
            COALESCE(totalgreen / NULLIF(timea, 0), 1) AS ooe
            , case when @machine_name = 'MT280100' then 7300 
            when @machine_name = 'JW220004' then 10300
            else 0
            end as budgetEnergyPerJam
        FROM IoT.dbo.mchstatustrx t
        CROSS JOIN TimeCalculations
        WHERE t.MchID = @machine_name
        ORDER BY t.ID DESC;

      `;
      return await queryDatabase(sqlQuery, { machine_name });
    }
  }