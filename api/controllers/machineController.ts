import { queryDatabase } from '../utils/queryDatabase';

export async function updateMachine(machineId: string, machineDescription: string, machineTonage: string, machineLocation: string, machineProcess: string, machineUap: string, machineEquipment: string, position: string, rotation: string, energyBudget: number) {
let sqlQuery = `
    UPDATE MachineMST
    SET 
    MchDesc = @machineDescription,
    MchTon = @machineTonage,
    MchLoc = @machineLocation,
    MchProcess = @machineProcess,
    UAP = @machineUap,
    position = @position,
    rotation = @rotation,
    energyBudget = @energyBudget
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
    

    return await queryDatabase(sqlQuery, { machineId, machineDescription, machineTonage, machineLocation, machineProcess, machineUap, machineEquipment, position, rotation, energyBudget });
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
    STRING_AGG(e.Name , ', ') AS equipment,  -- Concatenates multiple EquipmentIDs
    m.MchTon as tonage,
	sum(e.EnergyBudget) as EquipmentEnergyBudget,
	m.energyBudget as MachineEnergyBudget
FROM IoT.dbo.MachineMST m
LEFT JOIN IoT.dbo.MachineEquipmentMST em ON m.MchID = em.MchID and em.Active = 1
LEFT JOIN IoT.dbo.EquipmentMST e on e.EquipmentID = em.EquipmentID and e.Active = 1
WHERE
    m.Active = 1
    AND m.MchLoc IS NOT NULL
    AND m.MchLoc != 'Mixing Bld T'
    AND @type IS NULL OR m.MchProcess = @type
GROUP BY
    m.id, m.MchID, m.MchDesc, m.MchNumber, m.MchTon,
    m.MchLoc, m.position, m.rotation, m.MchProcess, m.uap, m.energyBudget
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

    SELECT s.SpindleSTD, d.highestCountSpindleInCurrentCycle as SpindleACT
    from Machine_UV_STD s
    join UV_CountingData_Log d on d.MchID = s.MchID and d.CREATED_AT between @from and @to
    where s.Active = 1 and s.MchID = @machine_id

    `

    return await queryDatabase(sqlQuery, {machine_id, date, shift});
  }
  else {const sqlQuery = `
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

        SELECT s.SpindleSTD, d.highestCountSpindleInCurrentCycle as SpindleACT
        from Machine_UV_STD s
        join UV_CountingData_Log d on d.MchID = s.MchID and d.CREATED_AT between @from and @to
        where s.Active = 1 and s.MchID = @machine_id

        UNION ALL

        SELECT s.SpindleSTD, d.highestCountSpindleInCurrentCycle as SpindleACT
        from Machine_UV_STD s
        join UV_CountingData d on d.MchID = s.MchID-- and d.CREATED_AT between @from and @to
        where s.Active = 1 and s.MchID = @machine_id

  `;
      return await queryDatabase(sqlQuery, { machine_id, date });
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
              from_datetime,
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
              from_datetime,
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
      //   console.log('HISTORY COUNTBOARD')

    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;
    DECLARE @current DATETIME = GETDATE();

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
    -- Creating a table with all 5 minute intervals for the day
    WITH TimeIntervals AS (
        SELECT
            DATEADD(MINUTE, (rn-1)*5, @from) AS FromTime
        FROM (
            SELECT TOP 288 -- 288 = 24 hours * 12 intervals per hour
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
            FROM master.dbo.spt_values t1
            CROSS JOIN master.dbo.spt_values t2
        ) AS Numbers
    ),

    -- Get the last status before our time period (if exists)
    FirstStatus AS (
        SELECT TOP 1
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate < @from
        ORDER BY StatusDate DESC
    ),

    -- Combine the first status with all statuses in our period
    AllStatusChanges AS (
        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM FirstStatus

        UNION ALL

        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate BETWEEN @from AND @to
    ),

    -- Add lead/lag information to calculate durations
    StatusChanges AS (
        SELECT
            StatusDate AS ChangeTime,
            StatusLight,
            MchID,
            LEAD(StatusDate) OVER (ORDER BY StatusDate) AS NextStatusDate
        FROM AllStatusChanges
    ),

    -- Calculate duration of each status light for each 5-minute interval
    IntervalStatus AS (
        SELECT
            t.FromTime,
            s.StatusLight,
            s.MchID,
            CASE
                -- Status spans the entire interval
                WHEN s.ChangeTime <= t.FromTime AND (s.NextStatusDate IS NULL OR s.NextStatusDate > DATEADD(MINUTE, 5, t.FromTime))
                    THEN 300 -- 5 minutes in seconds

                -- Status starts before interval but ends within it
                WHEN s.ChangeTime <= t.FromTime AND s.NextStatusDate <= DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, t.FromTime, s.NextStatusDate)

                -- Status starts within interval and continues beyond it
                WHEN s.ChangeTime > t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime) AND
                    (s.NextStatusDate IS NULL OR s.NextStatusDate >= DATEADD(MINUTE, 5, t.FromTime))
                    THEN DATEDIFF(SECOND, s.ChangeTime, DATEADD(MINUTE, 5, t.FromTime))

                -- Status starts and ends within the interval
                WHEN s.ChangeTime > t.FromTime AND s.NextStatusDate < DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, s.ChangeTime, s.NextStatusDate)

                ELSE 0
            END AS DurationSeconds
        FROM TimeIntervals t
        CROSS APPLY (
            SELECT * FROM StatusChanges s
            WHERE (s.ChangeTime <= t.FromTime AND (s.NextStatusDate > t.FromTime OR s.NextStatusDate IS NULL))
            OR (s.ChangeTime >= t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime))
        ) s
    ),

    -- Get the status with maximum duration for each interval
    MaxDuration AS (
        SELECT
            FromTime,
            StatusLight,
            MchID,
            DurationSeconds,
            ROW_NUMBER() OVER (PARTITION BY FromTime ORDER BY DurationSeconds DESC) AS rn
        FROM IntervalStatus
    )

    -- Final output with pivoted data
    SELECT
        CASE WHEN StatusLight = 'BLUE' THEN 1 ELSE NULL END AS blue,
        CASE WHEN StatusLight = 'ORANGE' THEN 1 ELSE NULL END AS orange,
        CASE WHEN StatusLight = 'PURPLE' THEN 1 ELSE NULL END AS purple,
        CASE WHEN StatusLight = 'GREY' THEN 1 ELSE NULL END AS grey,
        CASE WHEN StatusLight = 'YELLOW' THEN 1 ELSE NULL END AS yellow,
        CASE WHEN StatusLight = 'WHITE' THEN 1 ELSE NULL END AS white,
        CASE WHEN StatusLight = 'RED' THEN 1 ELSE NULL END AS red,
        CASE WHEN StatusLight = 'GREEN' THEN 1 ELSE NULL END AS green,
        fromTime
    FROM (
        SELECT
            t.FromTime,
            -- Return NULL for future time periods
            CASE
                WHEN t.FromTime > @current THEN NULL
                ELSE ISNULL(m.StatusLight, NULL)
            END AS StatusLight
        FROM TimeIntervals t
        LEFT JOIN MaxDuration m ON t.FromTime = m.FromTime AND m.rn = 1
    ) AS StatusData
    ORDER BY FromTime;


    `
    return await queryDatabase(sqlQuery, {machine_id, date, shift})
  } else if(ems && !date){ // LIVE EMS

    const sqlQuery = `

    DECLARE @from DATETIME;
    DECLARE @to DATETIME;
    DECLARE @current DATETIME = GETDATE();
    DECLARE @date DATE = COALESCE(NULL, CAST(@current AS DATE));


    SET @from = DATEADD(HOUR, 0, CAST(@date AS DATETIME));
    SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, CAST(@date AS DATETIME)));

    -- Creating a table with all 5 minute intervals for the day
    WITH TimeIntervals AS (
        SELECT
            DATEADD(MINUTE, (rn-1)*5, @from) AS FromTime
        FROM (
            SELECT TOP 288 -- 288 = 24 hours * 12 intervals per hour
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
            FROM master.dbo.spt_values t1
            CROSS JOIN master.dbo.spt_values t2
        ) AS Numbers
    ),

    -- Get the last status before our time period (if exists)
    FirstStatus AS (
        SELECT TOP 1
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate < @from
        ORDER BY StatusDate DESC
    ),

    -- Combine the first status with all statuses in our period
    AllStatusChanges AS (
        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM FirstStatus

        UNION ALL

        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate BETWEEN @from AND @to
    ),

    -- Add lead/lag information to calculate durations
    StatusChanges AS (
        SELECT
            StatusDate AS ChangeTime,
            StatusLight,
            MchID,
            LEAD(StatusDate) OVER (ORDER BY StatusDate) AS NextStatusDate
        FROM AllStatusChanges
    ),

    -- Calculate duration of each status light for each 5-minute interval
    IntervalStatus AS (
        SELECT
            t.FromTime,
            s.StatusLight,
            s.MchID,
            CASE
                -- Status spans the entire interval
                WHEN s.ChangeTime <= t.FromTime AND (s.NextStatusDate IS NULL OR s.NextStatusDate > DATEADD(MINUTE, 5, t.FromTime))
                    THEN 300 -- 5 minutes in seconds

                -- Status starts before interval but ends within it
                WHEN s.ChangeTime <= t.FromTime AND s.NextStatusDate <= DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, t.FromTime, s.NextStatusDate)

                -- Status starts within interval and continues beyond it
                WHEN s.ChangeTime > t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime) AND
                    (s.NextStatusDate IS NULL OR s.NextStatusDate >= DATEADD(MINUTE, 5, t.FromTime))
                    THEN DATEDIFF(SECOND, s.ChangeTime, DATEADD(MINUTE, 5, t.FromTime))

                -- Status starts and ends within the interval
                WHEN s.ChangeTime > t.FromTime AND s.NextStatusDate < DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, s.ChangeTime, s.NextStatusDate)

                ELSE 0
            END AS DurationSeconds
        FROM TimeIntervals t
        CROSS APPLY (
            SELECT * FROM StatusChanges s
            WHERE (s.ChangeTime <= t.FromTime AND (s.NextStatusDate > t.FromTime OR s.NextStatusDate IS NULL))
            OR (s.ChangeTime >= t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime))
        ) s
    ),

    -- Get the status with maximum duration for each interval
    MaxDuration AS (
        SELECT
            FromTime,
            StatusLight,
            MchID,
            DurationSeconds,
            ROW_NUMBER() OVER (PARTITION BY FromTime ORDER BY DurationSeconds DESC) AS rn
        FROM IntervalStatus
    )

    -- Final output with pivoted data
    SELECT
        CASE WHEN StatusLight = 'BLUE' THEN 1 ELSE NULL END AS blue,
        CASE WHEN StatusLight = 'ORANGE' THEN 1 ELSE NULL END AS orange,
        CASE WHEN StatusLight = 'PURPLE' THEN 1 ELSE NULL END AS purple,
        CASE WHEN StatusLight = 'GREY' THEN 1 ELSE NULL END AS grey,
        CASE WHEN StatusLight = 'YELLOW' THEN 1 ELSE NULL END AS yellow,
        CASE WHEN StatusLight = 'WHITE' THEN 1 ELSE NULL END AS white,
        CASE WHEN StatusLight = 'RED' THEN 1 ELSE NULL END AS red,
        CASE WHEN StatusLight = 'GREEN' THEN 1 ELSE NULL END AS green,
        fromTime
    FROM (
        SELECT
            t.FromTime,
            -- Return NULL for future time periods
            CASE
                WHEN t.FromTime > @current THEN NULL
                ELSE ISNULL(m.StatusLight, NULL)
            END AS StatusLight
        FROM TimeIntervals t
        LEFT JOIN MaxDuration m ON t.FromTime = m.FromTime AND m.rn = 1
    ) AS StatusData
    ORDER BY FromTime;
    `
      return await queryDatabase(sqlQuery, { machine_id, shift })
  } else if(date && ems){ // HISTORY EMS

    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;
    DECLARE @current DATETIME = GETDATE();

    SET @from = DATEADD(HOUR, 0, CAST(@date AS DATETIME));
    SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, CAST(@date AS DATETIME)));

    -- Creating a table with all 5 minute intervals for the day
    WITH TimeIntervals AS (
        SELECT
            DATEADD(MINUTE, (rn-1)*5, @from) AS FromTime
        FROM (
            SELECT TOP 288 -- 288 = 24 hours * 12 intervals per hour
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
            FROM master.dbo.spt_values t1
            CROSS JOIN master.dbo.spt_values t2
        ) AS Numbers
    ),

    -- Get the last status before our time period (if exists)
    FirstStatus AS (
        SELECT TOP 1
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate < @from
        ORDER BY StatusDate DESC
    ),

    -- Combine the first status with all statuses in our period
    AllStatusChanges AS (
        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM FirstStatus

        UNION ALL

        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate BETWEEN @from AND @to
    ),

    -- Add lead/lag information to calculate durations
    StatusChanges AS (
        SELECT
            StatusDate AS ChangeTime,
            StatusLight,
            MchID,
            LEAD(StatusDate) OVER (ORDER BY StatusDate) AS NextStatusDate
        FROM AllStatusChanges
    ),

    -- Calculate duration of each status light for each 5-minute interval
    IntervalStatus AS (
        SELECT
            t.FromTime,
            s.StatusLight,
            s.MchID,
            CASE
                -- Status spans the entire interval
                WHEN s.ChangeTime <= t.FromTime AND (s.NextStatusDate IS NULL OR s.NextStatusDate > DATEADD(MINUTE, 5, t.FromTime))
                    THEN 300 -- 5 minutes in seconds

                -- Status starts before interval but ends within it
                WHEN s.ChangeTime <= t.FromTime AND s.NextStatusDate <= DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, t.FromTime, s.NextStatusDate)

                -- Status starts within interval and continues beyond it
                WHEN s.ChangeTime > t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime) AND
                    (s.NextStatusDate IS NULL OR s.NextStatusDate >= DATEADD(MINUTE, 5, t.FromTime))
                    THEN DATEDIFF(SECOND, s.ChangeTime, DATEADD(MINUTE, 5, t.FromTime))

                -- Status starts and ends within the interval
                WHEN s.ChangeTime > t.FromTime AND s.NextStatusDate < DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, s.ChangeTime, s.NextStatusDate)

                ELSE 0
            END AS DurationSeconds
        FROM TimeIntervals t
        CROSS APPLY (
            SELECT * FROM StatusChanges s
            WHERE (s.ChangeTime <= t.FromTime AND (s.NextStatusDate > t.FromTime OR s.NextStatusDate IS NULL))
            OR (s.ChangeTime >= t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime))
        ) s
    ),

    -- Get the status with maximum duration for each interval
    MaxDuration AS (
        SELECT
            FromTime,
            StatusLight,
            MchID,
            DurationSeconds,
            ROW_NUMBER() OVER (PARTITION BY FromTime ORDER BY DurationSeconds DESC) AS rn
        FROM IntervalStatus
    )

    -- Final output with pivoted data
    SELECT
        CASE WHEN StatusLight = 'BLUE' THEN 1 ELSE NULL END AS blue,
        CASE WHEN StatusLight = 'ORANGE' THEN 1 ELSE NULL END AS orange,
        CASE WHEN StatusLight = 'PURPLE' THEN 1 ELSE NULL END AS purple,
        CASE WHEN StatusLight = 'GREY' THEN 1 ELSE NULL END AS grey,
        CASE WHEN StatusLight = 'YELLOW' THEN 1 ELSE NULL END AS yellow,
        CASE WHEN StatusLight = 'WHITE' THEN 1 ELSE NULL END AS white,
        CASE WHEN StatusLight = 'RED' THEN 1 ELSE NULL END AS red,
        CASE WHEN StatusLight = 'GREEN' THEN 1 ELSE NULL END AS green,
        fromTime
    FROM (
        SELECT
            t.FromTime,
            -- Return NULL for future time periods
            CASE
                WHEN t.FromTime > @current THEN NULL
                ELSE ISNULL(m.StatusLight, NULL)
            END AS StatusLight
        FROM TimeIntervals t
        LEFT JOIN MaxDuration m ON t.FromTime = m.FromTime AND m.rn = 1
    ) AS StatusData
    ORDER BY FromTime;

    `
    return await queryDatabase(sqlQuery, {machine_id, date, shift})
  } else { // LIVE COUNTBOARD
      //   console.log('LIVE COUNTBOARD')



    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;
    DECLARE @shift int;
    DECLARE @current DATETIME = GETDATE();
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
    END;

    WITH TimeIntervals AS (
        SELECT
            DATEADD(MINUTE, (rn-1)*5, @from) AS FromTime
        FROM (
            SELECT TOP 288 -- 288 = 24 hours * 12 intervals per hour
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
            FROM master.dbo.spt_values t1
            CROSS JOIN master.dbo.spt_values t2
        ) AS Numbers
    ),

    -- Get the last status before our time period (if exists)
    FirstStatus AS (
        SELECT TOP 1
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate < @from
        ORDER BY StatusDate DESC
    ),

    -- Combine the first status with all statuses in our period
    AllStatusChanges AS (
        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM FirstStatus

        UNION ALL

        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate BETWEEN @from AND @to
    ),

    -- Add lead/lag information to calculate durations
    StatusChanges AS (
        SELECT
            StatusDate AS ChangeTime,
            StatusLight,
            MchID,
            LEAD(StatusDate) OVER (ORDER BY StatusDate) AS NextStatusDate
        FROM AllStatusChanges
    ),

    -- Calculate duration of each status light for each 5-minute interval
    IntervalStatus AS (
        SELECT
            t.FromTime,
            s.StatusLight,
            s.MchID,
            CASE
                -- Status spans the entire interval
                WHEN s.ChangeTime <= t.FromTime AND (s.NextStatusDate IS NULL OR s.NextStatusDate > DATEADD(MINUTE, 5, t.FromTime))
                    THEN 300 -- 5 minutes in seconds

                -- Status starts before interval but ends within it
                WHEN s.ChangeTime <= t.FromTime AND s.NextStatusDate <= DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, t.FromTime, s.NextStatusDate)

                -- Status starts within interval and continues beyond it
                WHEN s.ChangeTime > t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime) AND
                    (s.NextStatusDate IS NULL OR s.NextStatusDate >= DATEADD(MINUTE, 5, t.FromTime))
                    THEN DATEDIFF(SECOND, s.ChangeTime, DATEADD(MINUTE, 5, t.FromTime))

                -- Status starts and ends within the interval
                WHEN s.ChangeTime > t.FromTime AND s.NextStatusDate < DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, s.ChangeTime, s.NextStatusDate)

                ELSE 0
            END AS DurationSeconds
        FROM TimeIntervals t
        CROSS APPLY (
            SELECT * FROM StatusChanges s
            WHERE (s.ChangeTime <= t.FromTime AND (s.NextStatusDate > t.FromTime OR s.NextStatusDate IS NULL))
            OR (s.ChangeTime >= t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime))
        ) s
    ),

    -- Get the status with maximum duration for each interval
    MaxDuration AS (
        SELECT
            FromTime,
            StatusLight,
            MchID,
            DurationSeconds,
            ROW_NUMBER() OVER (PARTITION BY FromTime ORDER BY DurationSeconds DESC) AS rn
        FROM IntervalStatus
    )

    -- Final output with pivoted data
    SELECT
        CASE WHEN StatusLight = 'BLUE' THEN 1 ELSE NULL END AS blue,
        CASE WHEN StatusLight = 'ORANGE' THEN 1 ELSE NULL END AS orange,
        CASE WHEN StatusLight = 'PURPLE' THEN 1 ELSE NULL END AS purple,
        CASE WHEN StatusLight = 'GREY' THEN 1 ELSE NULL END AS grey,
        CASE WHEN StatusLight = 'YELLOW' THEN 1 ELSE NULL END AS yellow,
        CASE WHEN StatusLight = 'WHITE' THEN 1 ELSE NULL END AS white,
        CASE WHEN StatusLight = 'RED' THEN 1 ELSE NULL END AS red,
        CASE WHEN StatusLight = 'GREEN' THEN 1 ELSE NULL END AS green,
        fromTime
    FROM (
        SELECT
            t.FromTime,
            -- Return NULL for future time periods
            CASE
                WHEN t.FromTime > @current THEN NULL
                ELSE ISNULL(m.StatusLight, NULL)
            END AS StatusLight
        FROM TimeIntervals t
        LEFT JOIN MaxDuration m ON t.FromTime = m.FromTime AND m.rn = 1
    ) AS StatusData
    ORDER BY FromTime;

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
        SET @to = DATEADD(SECOND, -1, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Until the last second of the day

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
        ,AdjustedHourlyReadings AS (
            SELECT
                Year, Month, Day, Hour, EarliestPMDT,
                CASE
                    WHEN DATEPART(HOUR, LatestPMDT) = 0 AND DATEPART(DAY, LatestPMDT) = DATEPART(DAY, DATEADD(DAY, 1, CAST(@date AS DATETIME)))
                    THEN NULL
                    ELSE LatestPMDT
                END AS LatestPMDT
            FROM HourlyReadings
        )
        ,FinalHourlyReadings AS (
            SELECT
                Year, Month, Day, Hour, EarliestPMDT,
                ISNULL(LatestPMDT,
                    (SELECT MIN(PMDT)
                    FROM eEnergy.dbo.PowerMeter
                    WHERE PMDT > EarliestPMDT AND MchID = @machine_name AND active = 1 AND PMType = 'ENERGY'
                    AND DATEPART(DAY, PMDT) = DATEPART(DAY, EarliestPMDT) + 1)) AS LatestPMDT
            FROM AdjustedHourlyReadings
        )
        ,EnergyData AS (
            SELECT
                h.Year, h.Month, h.Day,
                FORMAT(DATEADD(HOUR, h.Hour, '1900-01-01'), 'HH:00') AS hour,
                e1.PMValue AS StartEnergy,
                e1.PMDT as StartTime,
                e2.PMValue AS EndEnergy,
                e2.PMDT as EndTime,
                e2.PMValue - e1.PMValue AS consumption,
                e1.MchID
            FROM FinalHourlyReadings h
            JOIN eEnergy.dbo.PowerMeter e1 ON e1.PMDT = h.EarliestPMDT AND e1.MchID = @machine_name
            LEFT JOIN eEnergy.dbo.PowerMeter e2 ON e2.PMDT = h.LatestPMDT AND e2.MchID = @machine_name
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
        SET @to = DATEADD(SECOND, -1, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime)));; -- Goes into the next day

    
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
        ,AdjustedHourlyReadings AS (
            SELECT
                Year, Month, Day, Hour, EarliestPMDT,
                CASE
                    WHEN DATEPART(HOUR, LatestPMDT) = 0 AND DATEPART(DAY, LatestPMDT) = DATEPART(DAY, DATEADD(DAY, 1, CAST(@from AS DATETIME)))
                    THEN NULL
                    ELSE LatestPMDT
                END AS LatestPMDT
            FROM HourlyReadings
        )
        ,FinalHourlyReadings AS (
            SELECT
                Year, Month, Day, Hour, EarliestPMDT,
                ISNULL(LatestPMDT,
                    (SELECT MAX(PMDT)
                    FROM eEnergy.dbo.PowerMeter
                    WHERE PMDT > EarliestPMDT AND MchID = @machine_name AND active = 1 AND PMType = 'ENERGY'
                    )) AS LatestPMDT
            FROM AdjustedHourlyReadings
        )
        ,EnergyData AS (
            SELECT
                h.Year, h.Month, h.Day,
                FORMAT(DATEADD(HOUR, h.Hour, '1900-01-01'), 'HH:00') AS hour,
                e1.PMValue AS StartEnergy,
                e1.PMDT as StartTime,
                e2.PMValue AS EndEnergy,
                e2.PMDT as EndTime,
                e2.PMValue - e1.PMValue AS consumption,
                e1.MchID
            FROM FinalHourlyReadings h
            JOIN eEnergy.dbo.PowerMeter e1 ON e1.PMDT = h.EarliestPMDT AND e1.MchID = @machine_name
            LEFT JOIN eEnergy.dbo.PowerMeter e2 ON e2.PMDT = h.LatestPMDT AND e2.MchID = @machine_name
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

        IF NOT EXISTS (
            SELECT 1
            FROM eEnergy.dbo.PowerMeter
            WHERE TrxType = 'Manual'
            AND MchID = @machine_name
            AND Active = 1
            AND PMDT BETWEEN @from AND @to
        )
        BEGIN
            -- If no 'Manual' records exist, return fallback values
            WITH FallbackValues AS (
                SELECT
                    (SELECT TOP 1 StatusLightBefore
                    FROM eEnergy.dbo.PowerMeter
                    WHERE MchID = @machine_name AND TrxType = 'Manual' AND Active = 1
                    AND PMDT > @from ORDER BY id DESC) AS StatusLightBefore,
                    (SELECT TOP 1 StatusLight
                    FROM eEnergy.dbo.PowerMeter
                    WHERE MchID = @machine_name AND TrxType = 'Manual' AND Active = 1
                    AND PMDT > @from ORDER BY id DESC) AS StatusLight,
                    @from AS BeforePMDT,
                    @to AS PMDT,
                    MAX(PMValue) - MIN(PMValue) AS valueUsed,
                    MAX(PMValue) AS ManualPMValue
                FROM eEnergy.dbo.PowerMeter WITH (NOLOCK)
                WHERE
                    TrxType = 'Automatic'
                    AND MchID = @machine_name
                    AND Active = 1
                    AND PMDT BETWEEN @from AND @to
            )
            SELECT
                f.StatusLightBefore,
                f.valueUsed AS TotalEnergyUsed,
                CAST(DATEDIFF(SECOND, f.BeforePMDT, f.PMDT) AS FLOAT) / 3600 AS DurationHours
            FROM FallbackValues f;
        END
        ELSE
        BEGIN
            -- If 'Manual' records exist, proceed with the original logic
            WITH StatusWithDuration AS (
                SELECT
                    StatusLightBefore,
                    StatusLight,
                    LAG(PMDT) OVER (PARTITION BY MchID ORDER BY PMDT) AS BeforePMDT,
                    PMDT,
                    valueUsed,
                    PMValue AS ManualPMValue
                FROM eEnergy.dbo.PowerMeter WITH (NOLOCK)
                WHERE
                    TrxType = 'Manual'
                    AND MchID = @machine_name
                    AND Active = 1
                    AND PMDT BETWEEN @from AND @to
            ),
            LatestEnergy AS (
                SELECT TOP 1 PMValue AS LatestPMValue
                FROM eEnergy.dbo.PowerMeter WITH (NOLOCK)
                WHERE TrxType = 'Automatic'
                AND MchID = @machine_name
                AND Active = 1
                AND PMDT BETWEEN @from AND @to
                ORDER BY id DESC
            ),
            FirstEnergy AS (
                SELECT TOP 1 PMValue AS FirstPMValue
                FROM eEnergy.dbo.PowerMeter WITH (NOLOCK)
                WHERE TrxType = 'Automatic'
                AND MchID = @machine_name
                AND Active = 1
                AND PMDT BETWEEN @from AND @to
                ORDER BY id asc
            ),
            LastManualEnergy AS (
                SELECT TOP 1 ManualPMValue AS LastManualPMValue, StatusLight, StatusLightBefore
                FROM StatusWithDuration
                ORDER BY PMDT DESC
            ),
            FirstManualEnergy AS (
                SELECT TOP 1 ManualPMValue AS FirstManualPMValue, StatusLight, StatusLightBefore
                FROM StatusWithDuration
                ORDER BY PMDT ASC
            )
            SELECT
                s.StatusLightBefore,
                SUM(s.valueUsed) +
                CASE
                    WHEN s.StatusLightBefore = (SELECT StatusLight FROM LastManualEnergy)
                    THEN (
                        SELECT
                            CASE
                                WHEN LatestPMValue IS NOT NULL AND LastManualPMValue IS NOT NULL
                                THEN (LatestPMValue - LastManualPMValue)
                                ELSE 0
                            END
                        FROM LatestEnergy, LastManualEnergy
                    )
                    WHEN s.StatusLightBefore = (SELECT StatusLightBefore FROM FirstManualEnergy)
                    THEN (
                        SELECT
                            CASE
                                WHEN FirstPMValue IS NOT NULL and FirstManualPMValue IS NOT NULL
                                THEN  (FirstManualPMValue - FirstPMValue)
                                ELSE 0
                            END
                        FROM  FirstEnergy, FirstManualEnergy
                    )
                    ELSE 0
                END AS TotalEnergyUsed,
                SUM(CAST(DATEDIFF(SECOND, s.BeforePMDT, s.PMDT) AS FLOAT) / 3600) AS DurationHours
            FROM StatusWithDuration s WITH (NOLOCK)
            WHERE s.BeforePMDT IS NOT NULL
            GROUP BY s.StatusLightBefore
            ORDER BY MIN(s.PMDT);
        END

    
      `
      return await queryDatabase(sqlQuery, { machine_name, date });
    }
    else {
      const sqlQuery = `
      DECLARE @from DATETIME;
      DECLARE @to DATETIME;
  
        SET @from =DATEADD(HOUR, 0,cast(CAST(GETDATE() AS date)as datetime)) ; 
        SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime))); -- Goes into the next day

    
        -- Check if any 'Manual' records exist
        IF NOT EXISTS (
            SELECT 1
            FROM eEnergy.dbo.PowerMeter
            WHERE TrxType = 'Manual'
            AND MchID = @machine_name
            AND Active = 1
            AND PMDT BETWEEN @from AND @to
        )
        BEGIN
            -- If no 'Manual' records exist, return fallback values
            WITH FallbackValues AS (
                SELECT
                    (SELECT TOP 1 StatusLightBefore
                    FROM eEnergy.dbo.PowerMeter
                    WHERE MchID = @machine_name AND TrxType = 'Manual' AND Active = 1
                    AND PMDT > @from ORDER BY id DESC) AS StatusLightBefore,
                    (SELECT TOP 1 StatusLight
                    FROM eEnergy.dbo.PowerMeter
                    WHERE MchID = @machine_name AND TrxType = 'Manual' AND Active = 1
                    AND PMDT > @from ORDER BY id DESC) AS StatusLight,
                    @from AS BeforePMDT,
                    @to AS PMDT,
                    MAX(PMValue) - MIN(PMValue) AS valueUsed,
                    MAX(PMValue) AS ManualPMValue
                FROM eEnergy.dbo.PowerMeter WITH (NOLOCK)
                WHERE
                    TrxType = 'Automatic'
                    AND MchID = @machine_name
                    AND Active = 1
                    AND PMDT BETWEEN @from AND @to
            )
            SELECT
                f.StatusLightBefore,
                f.valueUsed AS TotalEnergyUsed,
                CAST(DATEDIFF(SECOND, f.BeforePMDT, f.PMDT) AS FLOAT) / 3600 AS DurationHours
            FROM FallbackValues f;
        END
        ELSE
        BEGIN
            -- If 'Manual' records exist, proceed with the original logic
            WITH StatusWithDuration AS (
                SELECT
                    StatusLightBefore,
                    StatusLight,
                    LAG(PMDT) OVER (PARTITION BY MchID ORDER BY PMDT) AS BeforePMDT,
                    PMDT,
                    valueUsed,
                    PMValue AS ManualPMValue
                FROM eEnergy.dbo.PowerMeter WITH (NOLOCK)
                WHERE
                    TrxType = 'Manual'
                    AND MchID = @machine_name
                    AND Active = 1
                    AND PMDT BETWEEN @from AND @to
            ),
            LatestEnergy AS (
                SELECT TOP 1 PMValue AS LatestPMValue
                FROM eEnergy.dbo.PowerMeter WITH (NOLOCK)
                WHERE TrxType = 'Automatic'
                AND MchID = @machine_name
                AND Active = 1
                AND PMDT BETWEEN @from AND @to
                ORDER BY id DESC
            ),
            FirstEnergy AS (
                SELECT TOP 1 PMValue AS FirstPMValue
                FROM eEnergy.dbo.PowerMeter WITH (NOLOCK)
                WHERE TrxType = 'Automatic'
                AND MchID = @machine_name
                AND Active = 1
                AND PMDT BETWEEN @from AND @to
                ORDER BY id asc
            ),
            LastManualEnergy AS (
                SELECT TOP 1 ManualPMValue AS LastManualPMValue, StatusLight, StatusLightBefore
                FROM StatusWithDuration
                ORDER BY PMDT DESC
            ),
            FirstManualEnergy AS (
                SELECT TOP 1 ManualPMValue AS FirstManualPMValue, StatusLight, StatusLightBefore
                FROM StatusWithDuration
                ORDER BY PMDT ASC
            )
            SELECT
                s.StatusLightBefore,
                SUM(s.valueUsed) +
                CASE
                    WHEN s.StatusLightBefore = (SELECT StatusLight FROM LastManualEnergy)
                    THEN (
                        SELECT
                            CASE
                                WHEN LatestPMValue IS NOT NULL AND LastManualPMValue IS NOT NULL
                                THEN (LatestPMValue - LastManualPMValue)
                                ELSE 0
                            END
                        FROM LatestEnergy, LastManualEnergy
                    )
                    WHEN s.StatusLightBefore = (SELECT StatusLightBefore FROM FirstManualEnergy)
                    THEN (
                        SELECT
                            CASE
                                WHEN FirstPMValue IS NOT NULL and FirstManualPMValue IS NOT NULL
                                THEN  (FirstManualPMValue - FirstPMValue)
                                ELSE 0
                            END
                        FROM  FirstEnergy, FirstManualEnergy
                    )
                    ELSE 0
                END AS TotalEnergyUsed,
                SUM(CAST(DATEDIFF(SECOND, s.BeforePMDT, s.PMDT) AS FLOAT) / 3600) AS DurationHours
            FROM StatusWithDuration s WITH (NOLOCK)
            WHERE s.BeforePMDT IS NOT NULL
            GROUP BY s.StatusLightBefore
            ORDER BY MIN(s.PMDT);
        END

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