import { Context } from 'hono';
import { queryDatabase, streamQuery } from '../utils/queryDatabase';

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

export async function getChangeState(machine_name: string, date: string | null, shift: string | null, date_from: string | null, date_to: string | null) {
    if (date && shift && machine_name && machine_name !== 'all') {
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
            SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, cast(CAST(@date AS date)as datetime))); -- Goes into the next day
        END  
    
        SELECT ID, StatusDate as AdjustedStatusDate, StatusLight as Color
        from IoT.dbo.MchStatusTRX with (nolock)
        Where MchID = @machine_name  and Active = 1
        and StatusDate between @from and @to



        UNION ALL

        SELECT ID, @from as AdjustedStatusDate, StatusLight as Color
        from (
            SELECT TOP 1 ID, StatusLight
            from IoT.dbo.MchStatusTRX
            Where MchID = @machine_name
            and StatusDate < @from and Active = 1
            order by StatusDate DESC
        ) as LastStatus
        `;
        return await queryDatabase(sqlQuery, {machine_name, date, shift});
    } else if (machine_name === 'all' && date_from && date_to) {
        const sqlQuery = `
        SELECT m1.ID, m2.MchID,m1.StatusDate as AdjustedStatusDate, m1.StatusLight as Color
        from IoT.dbo.MchStatusTRX m1 with (nolock)
        join IoT.dbo.MachineMST m2 on m1.MchID = m2.MchID

        Where m1.Active = 1
        and StatusDate between @date_from and @date_to



        UNION ALL

        SELECT ID, MchID, @date_from as AdjustedStatusDate, StatusLight as Color
        from (
            SELECT TOP 1 m1.ID, m2.MchID, m1.StatusLight
            from IoT.dbo.MchStatusTRX m1
            join IoT.dbo.MachineMST m2 on m1.MchID = m2.MchID
            Where m1.StatusDate < @date_from and m1.Active = 1
            order by StatusDate DESC
        ) as LastStatus
        `;
        return await queryDatabase(sqlQuery, { date_from, date_to });
    }
    else {
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
            -- Check current time to determine shift 3 boundaries
            DECLARE @currentTime TIME = CAST(GETDATE() AS TIME);
            DECLARE @currentDate DATE = CAST(GETDATE() AS DATE);

            IF @currentTime >= '22:00:00'
            BEGIN
                -- If current time is 22:00 or later, shift 3 starts today at 22:00 and ends tomorrow at 6:00
                SET @from = DATEADD(HOUR, 22, CAST(GETDATE() AS DATETIME));
                SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, CAST(GETDATE() AS DATETIME)));
            END
            ELSE IF @currentTime < '06:00:00'
            BEGIN
                -- If current time is before 6:00, shift 3 started yesterday at 22:00 and ends today at 6:00
                SET @from = DATEADD(HOUR, 22, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME)));
                SET @to = DATEADD(HOUR, 6, CAST(GETDATE() AS DATETIME));
            END
            ELSE
            BEGIN
                -- Default case: shift 3 starts at 22:00 of the given date and ends at 6:00 of the next day
                SET @from = DATEADD(HOUR, 22, CAST(GETDATE() AS DATETIME));
                SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, CAST(GETDATE() AS DATETIME)));
            END
            END

        SELECT ID, StatusDate as AdjustedStatusDate, StatusLight as Color
        from IoT.dbo.MchStatusTRX with (nolock)
        Where MchID = @machine_name and Active = 1
        and StatusDate between @from and @to



        UNION ALL

        SELECT ID, @from as AdjustedStatusDate, StatusLight as Color
        from (
            SELECT TOP 1 ID, StatusLight
            from IoT.dbo.MchStatusTRX
            Where MchID = @machine_name
            and StatusDate < @from and Active = 1
            order by StatusDate DESC
        ) as LastStatus
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
    m.MchStatus as machineStatus,
    m.position,
    m.rotation,
    m.MchProcess as Process,
    m.uap,
    STRING_AGG(e.Name , ', ') AS equipment,  -- Concatenates multiple EquipmentIDs
    m.MchTon as tonage,
	sum(e.EnergyBudget) as EquipmentEnergyBudget,
	m.energyBudget as MachineEnergyBudget,
    m.Type as machineType
FROM IoT.dbo.MachineMST m
LEFT JOIN IoT.dbo.MachineEquipmentMST em ON m.MchID = em.MchID and em.Active = 1
LEFT JOIN IoT.dbo.EquipmentMST e on e.EquipmentID = em.EquipmentID and e.Active = 1
WHERE
    m.Active = 1
    AND m.MchLoc IS NOT NULL
    AND m.MchLoc != 'NULL'
    AND m.MchLoc != 'Mixing Bld T'
     AND (@type IS NULL OR m.MchProcess = @type)
GROUP BY
    m.id, m.MchID, m.MchDesc, m.MchNumber, m.MchTon,
    m.MchLoc, m.position, m.rotation, m.MchProcess, m.uap, m.energyBudget, m.Type, m.MchStatus
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
    ELSE IF @shift = 3
    BEGIN
        SET @from = DATEADD(HOUR, 22, CAST(@date AS DATETIME)); 
        SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, cast(CAST(@date AS date)as datetime))); -- Goes into the next day fix if now
    END  

    SELECT s.SpindleSTD, d.highestCountSpindleInCurrentCycle as SpindleACT, d.created_at
    ,[totalCountProductIn]
      ,[totalCountSpindleIn]
      ,[highestCountProductIn]
      ,[highestCountProductInCurrentCycle]
      ,[highestCountSpindleIn]
      ,[highestCountSpindleInCurrentCycle]
      ,[totalCountProductOut]
      ,[totalCountSpindleOut]
      ,[highestCountProductOut]
      ,[highestCountProductOutCurrentCycle]
      ,[highestCountSpindleOut]
      ,[highestCountSpindleOutCurrentCycle]
      ,[count_in_product]
      ,[last_data_in_product]
      ,[count_in_spindle]
      ,[last_data_in_spindle]
      ,[count_out_product]
      ,[last_data_out_product]
      ,[count_out_spindle]
      ,[last_data_out_spindle]
      ,[count_start]
      ,[last_data_start]
      ,[last_data_reject_a]
      ,[last_data_reject_b]
      ,[last_data_reject_c]
      ,[last_data_reject_d]
      ,[last_data_reject_e]
      ,[count_reject_a]
      ,[count_reject_b]
      ,[count_reject_c]
      ,[count_reject_d]
      ,[count_reject_e]

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
            -- Check current time to determine shift 3 boundaries
            DECLARE @currentTime TIME = CAST(GETDATE() AS TIME);
            DECLARE @currentDate DATE = CAST(GETDATE() AS DATE);

        IF @currentTime >= '22:00:00'
        BEGIN
            -- If current time is 22:00 or later, shift 3 starts today at 22:00 and ends tomorrow at 6:00
            SET @from = DATEADD(HOUR, 22, CAST(GETDATE() AS DATETIME));
            SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, CAST(GETDATE() AS DATETIME)));
        END
        ELSE IF @currentTime < '06:00:00'
        BEGIN
            -- If current time is before 6:00, shift 3 started yesterday at 22:00 and ends today at 6:00
            SET @from = DATEADD(HOUR, 22, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME)));
            SET @to = DATEADD(HOUR, 6, CAST(GETDATE() AS DATETIME));
        END
        ELSE
        BEGIN
            -- Default case: shift 3 starts at 22:00 of the given date and ends at 6:00 of the next day
            SET @from = DATEADD(HOUR, 22, CAST(GETDATE() AS DATETIME));
            SET @to = DATEADD(HOUR, 6, DATEADD(DAY, 1, CAST(GETDATE() AS DATETIME)));
            END
        END

        SELECT s.SpindleSTD, d.highestCountSpindleInCurrentCycle as SpindleACT, d.created_at
         ,[totalCountProductIn]
      ,[totalCountSpindleIn]
      ,[highestCountProductIn]
      ,[highestCountProductInCurrentCycle]
      ,[highestCountSpindleIn]
      ,[highestCountSpindleInCurrentCycle]
      ,[totalCountProductOut]
      ,[totalCountSpindleOut]
      ,[highestCountProductOut]
      ,[highestCountProductOutCurrentCycle]
      ,[highestCountSpindleOut]
      ,[highestCountSpindleOutCurrentCycle]
      ,[count_in_product]
      ,[last_data_in_product]
      ,[count_in_spindle]
      ,[last_data_in_spindle]
      ,[count_out_product]
      ,[last_data_out_product]
      ,[count_out_spindle]
      ,[last_data_out_spindle]
      ,[count_start]
      ,[last_data_start]
      ,[last_data_reject_a]
      ,[last_data_reject_b]
      ,[last_data_reject_c]
      ,[last_data_reject_d]
      ,[last_data_reject_e]
      ,[count_reject_a]
      ,[count_reject_b]
      ,[count_reject_c]
      ,[count_reject_d]
      ,[count_reject_e]
        from Machine_UV_STD s
        join UV_CountingData_Log d on d.MchID = s.MchID and d.CREATED_AT between @from and @to
        where s.Active = 1 and s.MchID = @machine_id

        UNION ALL

        SELECT s.SpindleSTD, d.highestCountSpindleInCurrentCycle as SpindleACT, getdate() as created_at
         ,[totalCountProductIn]
      ,[totalCountSpindleIn]
      ,[highestCountProductIn]
      ,[highestCountProductInCurrentCycle]
      ,[highestCountSpindleIn]
      ,[highestCountSpindleInCurrentCycle]
      ,[totalCountProductOut]
      ,[totalCountSpindleOut]
      ,[highestCountProductOut]
      ,[highestCountProductOutCurrentCycle]
      ,[highestCountSpindleOut]
      ,[highestCountSpindleOutCurrentCycle]
      ,[count_in_product]
      ,[last_data_in_product]
      ,[count_in_spindle]
      ,[last_data_in_spindle]
      ,[count_out_product]
      ,[last_data_out_product]
      ,[count_out_spindle]
      ,[last_data_out_spindle]
      ,[count_start]
      ,[last_data_start]
      ,[last_data_reject_a]
      ,[last_data_reject_b]
      ,[last_data_reject_c]
      ,[last_data_reject_d]
      ,[last_data_reject_e]
      ,[count_reject_a]
      ,[count_reject_b]
      ,[count_reject_c]
      ,[count_reject_d]
      ,[count_reject_e]
        from Machine_UV_STD s
        join UV_CountingData d on d.MchID = s.MchID
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
      if (date && shift) { // History Mode
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

      ;WITH CooisLatest AS (
            SELECT c1.*
            FROM IoT.dbo.coois c1
            JOIN (
                SELECT po_name, MAX(id) AS max_id
                FROM IoT.dbo.coois
                WHERE ISNULL(is_deleted, 0) = 0
                GROUP BY po_name
            ) latest ON c1.po_name = latest.po_name AND c1.id = latest.max_id
        )
        SELECT TOP 8
            h.id AS hourlyId,
            h.from_datetime,
            FORMAT(h.from_datetime, 'HH:mm') AS time,
            FORMAT(h.to_datetime, 'HH:mm') AS to_hour_minute,
            h.shift_id,
            c.material_id,
            ISNULL(h.running_target_qty, 0) AS target,
            ISNULL(h.target_qty, 0) AS target_final,
            ISNULL(h.running_target_qty, 0) * (select top 1 value from IoT.dbo.parameter_setting where name = 'target_tolerance') AS target_tolerance,
            ISNULL(h.running_actual_qty, 0) AS actual,
            ISNULL(h.running_actual_in_qty, 0) AS actual_in,
            ISNULL(h.running_actual_in_qty, 0) - ISNULL(h.running_actual_out_qty, 0) AS gap,
            h.task_id,
            h.target_qty,
            h.actual_qty,
            h.hour_id,
            h.machine_id,
            c.material_id AS itemNo,
            c.material_name AS itemDesc,
            case
                when (select problem from IoT.dbo.TicketTRX where MchID = @machine_id and TicketDate between @from and @to and problem != 'MicroStop' and problem != 'Not Given') is not null
                then (SELECT STRING_AGG(FORMAT(ticketDate, 'HH:mm') + ' ' + problem, ', ') AS ProblemList
                    FROM IoT.dbo.TicketTRX
                    WHERE MchID = @machine_id
                    AND TicketDate BETWEEN h.from_datetime AND h.to_datetime
                    AND problem != 'MicroStop'
                    AND problem != 'Not Given')
                else null
            end as problem,
            h.cause AS causes,
            case
                when (select actionplan from IoT.dbo.TicketTRX where MchID = @machine_id and TicketDate between @from and @to and problem != 'MicroStop' and problem != 'Not Given') is not null
                then (SELECT STRING_AGG(FORMAT(ticketDate, 'HH:mm') + ' ' + actionplan, ', ') AS ActionList
                    FROM IoT.dbo.TicketTRX
                    WHERE MchID = @machine_id
                    AND TicketDate BETWEEN h.from_datetime AND h.to_datetime
                    AND problem != 'MicroStop'
                    AND problem != 'Not Given')
                else null
            end as action,
            h.note AS comments,
            h.ooe,
            h.reject_a,
            h.reject_b,
            h.reject_c,
            h.reject_d,
            h.reject_e,
            ISNULL(rA.name, '') AS reject_a_name,
            ISNULL(rB.name, '') AS reject_b_name,
            ISNULL(rC.name, '') AS reject_c_name,
            ISNULL(rD.name, '') AS reject_d_name,
            ISNULL(rE.name, '') AS reject_e_name,
            h.process
        FROM IoT.dbo.hourly_uv h
        LEFT JOIN IoT.dbo.RejectMST rA ON h.reject_a_id = rA.id
        LEFT JOIN IoT.dbo.RejectMST rB ON h.reject_b_id = rB.id
        LEFT JOIN IoT.dbo.RejectMST rC ON h.reject_c_id = rC.id
        LEFT JOIN IoT.dbo.RejectMST rD ON h.reject_d_id = rD.id
        LEFT JOIN IoT.dbo.RejectMST rE ON h.reject_e_id = rE.id
        LEFT JOIN IoT.dbo.countboard_tasks t ON h.task_id = t.id
        LEFT JOIN CooisLatest c ON c.po_name = t.po_name
        WHERE h.machine_id = @machine_id
        AND h.shift_id = @shift
        AND h.from_datetime BETWEEN @from AND @to
        ORDER BY h.from_datetime asc;

      `
      return await queryDatabase(sqlQuery, { machine_id, date, shift });
      } else { // Live Mode
      const sqlQuery = `
      declare @shift_id int;
      declare @from DATETIME;
      declare @to DATETIME;
      set @shift_id = case when DATEPART(HOUR, GETDATE()) between 6 and 13 then 1 when DATEPART(HOUR, GETDATE()) between 14 and 22 then 2 else 3 end
      set @from = case when @shift_id = 1 then DATEADD(HOUR, 6, cast(CAST(GETDATE() AS date)as datetime))
      when @shift_id = 2 then DATEADD(HOUR, 14, cast(CAST(GETDATE() AS date)as datetime))
      when @shift_id = 3 then
        CASE
          WHEN DATEPART(HOUR, GETDATE()) >= 0 AND DATEPART(HOUR, GETDATE()) < 6
          THEN DATEADD(HOUR, 22, cast(DATEADD(DAY, -1, CAST(GETDATE() AS date)) as datetime))
          ELSE DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
        END
      end
      set @to = case when @shift_id = 1 then DATEADD(HOUR, 14, cast(CAST(GETDATE() AS date)as datetime))
      when @shift_id = 2 then DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
      when @shift_id = 3 then
        CASE
          WHEN DATEPART(HOUR, GETDATE()) >= 0 AND DATEPART(HOUR, GETDATE()) < 6
          THEN DATEADD(HOUR, 6, cast(CAST(GETDATE() AS date)as datetime))
          ELSE DATEADD(HOUR, 6, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime)))
        END
      end
      ;WITH CooisLatest AS (
        SELECT c1.*
        FROM IoT.dbo.coois c1
        JOIN (
            SELECT po_name, MAX(id) AS max_id
            FROM IoT.dbo.coois
            WHERE ISNULL(is_deleted, 0) = 0
            GROUP BY po_name
        ) latest ON c1.po_name = latest.po_name AND c1.id = latest.max_id
    )
    SELECT TOP 8
        h.id AS hourlyId,
        h.from_datetime,
        FORMAT(h.from_datetime, 'HH:mm') AS time,
        FORMAT(h.to_datetime, 'HH:mm') AS to_hour_minute,
        h.shift_id,
        c.material_id,
        ISNULL(h.running_target_qty, 0) AS target,
        ISNULL(h.target_qty, 0) AS target_final,
        ISNULL(h.running_target_qty, 0) * (select top 1 value from IoT.dbo.parameter_setting where name = 'target_tolerance') AS target_tolerance,
        ISNULL(h.running_actual_qty, 0) AS actual,
        ISNULL(h.running_actual_in_qty, 0) AS actual_in,
        ISNULL(h.running_actual_in_qty, 0) - ISNULL(h.running_actual_out_qty, 0) AS gap,
        h.task_id,
        h.target_qty,
        h.actual_qty,
        h.hour_id,
        h.machine_id,
        c.material_id AS itemNo,
        c.material_name AS itemDesc,
        case
                when (select problem from IoT.dbo.TicketTRX where MchID = @machine_id and TicketDate between @from and @to and problem != 'MicroStop' and problem != 'Not Given') is not null
                then (SELECT STRING_AGG(FORMAT(ticketDate, 'HH:mm') + ' ' + problem, ', ') AS ProblemList
                    FROM IoT.dbo.TicketTRX
                    WHERE MchID = @machine_id
                    AND TicketDate BETWEEN h.from_datetime AND h.to_datetime
                    AND problem != 'MicroStop'
                    AND problem != 'Not Given')
                else null
            end as problem,
            h.cause AS causes,
            case
                when (select actionplan from IoT.dbo.TicketTRX where MchID = @machine_id and TicketDate between @from and @to and problem != 'MicroStop' and problem != 'Not Given') is not null
                then (SELECT STRING_AGG(FORMAT(ticketDate, 'HH:mm') + ' ' + actionplan, ', ') AS ActionList
                    FROM IoT.dbo.TicketTRX
                    WHERE MchID = @machine_id
                    AND TicketDate BETWEEN h.from_datetime AND h.to_datetime
                    AND problem != 'MicroStop'
                    AND problem != 'Not Given')
                else null
            end as action,
            h.note AS comments,
        h.ooe,
        h.reject_a,
        h.reject_b,
        h.reject_c,
        h.reject_d,
        h.reject_e,
        ISNULL(rA.name, '') AS reject_a_name,
        ISNULL(rB.name, '') AS reject_b_name,
        ISNULL(rC.name, '') AS reject_c_name,
        ISNULL(rD.name, '') AS reject_d_name,
        ISNULL(rE.name, '') AS reject_e_name,
        h.process
    FROM IoT.dbo.hourly_uv h
    LEFT JOIN IoT.dbo.RejectMST rA ON h.reject_a_id = rA.id
    LEFT JOIN IoT.dbo.RejectMST rB ON h.reject_b_id = rB.id
    LEFT JOIN IoT.dbo.RejectMST rC ON h.reject_c_id = rC.id
    LEFT JOIN IoT.dbo.RejectMST rD ON h.reject_d_id = rD.id
    LEFT JOIN IoT.dbo.RejectMST rE ON h.reject_e_id = rE.id
    LEFT JOIN IoT.dbo.countboard_tasks t ON h.task_id = t.id
    LEFT JOIN CooisLatest c ON c.po_name = t.po_name
    WHERE h.machine_id = @machine_id
    AND h.shift_id = @shift_id
    AND h.from_datetime BETWEEN @from AND @to
    ORDER BY h.from_datetime asc;

      `;
      return await queryDatabase(sqlQuery, { machine_id });
    }
  } else if( type === 'injection'){
      if (date && shift) { // History Mode
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

    -- Use CTE to get latest non-deleted coois rows by po_name
    ;WITH CooisLatest AS (
        SELECT c1.*
        FROM IoT.dbo.coois c1
        JOIN (
            SELECT po_name, MAX(id) AS max_id
            FROM IoT.dbo.coois
            WHERE ISNULL(is_deleted, 0) = 0
            GROUP BY po_name
        ) latest ON c1.po_name = latest.po_name AND c1.id = latest.max_id
    )

    -- Main query
    SELECT TOP 8
        h.id AS hourlyId,
        FORMAT(h.from_datetime, 'HH:mm') AS time,
        FORMAT(h.to_datetime, 'HH:mm') AS to_hour_minute,
        h.from_datetime,
        h.shift_id,
        c.material_id,
        ISNULL(h.running_target_qty, 0) AS target,
        ISNULL(h.target_qty, 0) AS target_final,
        ISNULL(h.running_target_qty, 0) * (select top 1 value from IoT.dbo.parameter_setting where name = 'target_tolerance') AS target_tolerance,
        ISNULL(h.running_actual_qty, 0) AS actual,
        h.task_id,
        h.target_qty,
        h.actual_qty,
        h.hour_id,
        h.machine_id,
        c.material_id AS itemNo,
        c.material_name AS itemDesc,
        case
                when (select problem from IoT.dbo.TicketTRX where MchID = @machine_id and TicketDate between @from and @to and problem != 'MicroStop' and problem != 'Not Given') is not null
                then (SELECT STRING_AGG(FORMAT(ticketDate, 'HH:mm') + ' ' + problem, ', ') AS ProblemList
                    FROM IoT.dbo.TicketTRX
                    WHERE MchID = @machine_id
                    AND TicketDate BETWEEN h.from_datetime AND h.to_datetime)
                else null
            end as problem,
            h.cause AS causes,
            case
                when (select actionplan from IoT.dbo.TicketTRX where MchID = @machine_id and TicketDate between @from and @to and problem != 'MicroStop' and problem != 'Not Given') is not null
                then (SELECT STRING_AGG(FORMAT(ticketDate, 'HH:mm') + ' ' + actionplan, ', ') AS ActionList
                    FROM IoT.dbo.TicketTRX
                    WHERE MchID = @machine_id
                    AND TicketDate BETWEEN h.from_datetime AND h.to_datetime)
                else null
            end as action,
            h.note AS comments,
        h.ooe,
        h.scrap,
        h.rework
    FROM IoT.dbo.hourly h
    LEFT JOIN IoT.dbo.countboard_tasks t ON h.task_id = t.id
    LEFT JOIN CooisLatest c ON c.po_name = t.po_name
    WHERE h.machine_id = @machine_id
    AND h.shift_id = @shift
    AND h.from_datetime BETWEEN @from AND @to
    ORDER BY h.from_datetime asc;

      `
      return await queryDatabase(sqlQuery, { machine_id, date, shift });
      } else { // Live Mode
      const sqlQuery = `
      declare @shift_id int;
      declare @from DATETIME;
      declare @to DATETIME;
      set @shift_id = case when DATEPART(HOUR, GETDATE()) between 6 and 13 then 1 when DATEPART(HOUR, GETDATE()) between 14 and 22 then 2 else 3 end
      set @from = case when @shift_id = 1 then DATEADD(HOUR, 6, cast(CAST(GETDATE() AS date)as datetime))
      when @shift_id = 2 then DATEADD(HOUR, 14, cast(CAST(GETDATE() AS date)as datetime))
      when @shift_id = 3 then
        CASE
          WHEN DATEPART(HOUR, GETDATE()) >= 0 AND DATEPART(HOUR, GETDATE()) < 6
          THEN DATEADD(HOUR, 22, cast(DATEADD(DAY, -1, CAST(GETDATE() AS date)) as datetime))
          ELSE DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
        END
      end
      set @to = case when @shift_id = 1 then DATEADD(HOUR, 14, cast(CAST(GETDATE() AS date)as datetime))
      when @shift_id = 2 then DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
      when @shift_id = 3 then
        CASE
          WHEN DATEPART(HOUR, GETDATE()) >= 0 AND DATEPART(HOUR, GETDATE()) < 6
          THEN DATEADD(HOUR, 6, cast(CAST(GETDATE() AS date)as datetime))
          ELSE DATEADD(HOUR, 6, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime)))
        END
      end
        -- Use CTE to get latest non-deleted coois rows by po_name
        ;WITH CooisLatest AS (
            SELECT c1.*
            FROM IoT.dbo.coois c1
            JOIN (
                SELECT po_name, MAX(id) AS max_id
                FROM IoT.dbo.coois
                WHERE ISNULL(is_deleted, 0) = 0
                GROUP BY po_name
            ) latest ON c1.po_name = latest.po_name AND c1.id = latest.max_id
        )

        -- Main query
        SELECT TOP 8
            h.id AS hourlyId,
            FORMAT(h.from_datetime, 'HH:mm') AS time,
            FORMAT(h.to_datetime, 'HH:mm') AS to_hour_minute,
            h.from_datetime,
            h.shift_id,
            c.material_id,
            ISNULL(h.running_target_qty, 0) AS target,
            ISNULL(h.target_qty, 0) AS target_final,
            ISNULL(h.running_target_qty, 0) * (select top 1 value from IoT.dbo.parameter_setting where name = 'target_tolerance') AS target_tolerance,
            ISNULL(h.running_actual_qty, 0) AS actual,
            h.task_id,
            h.target_qty,
            h.actual_qty,
            h.hour_id,
            h.machine_id,
            c.material_id AS itemNo,
            c.material_name AS itemDesc,
            case
                when (select top 1 problem from IoT.dbo.TicketTRX where MchID = @machine_id and TicketDate between @from and @to and problem != 'MicroStop' and problem != 'Not Given') is not null
                then (SELECT STRING_AGG(FORMAT(ticketDate, 'HH:mm') + ' ' + problem, ', ') AS ProblemList
                    FROM IoT.dbo.TicketTRX
                    WHERE MchID = @machine_id
                    AND TicketDate BETWEEN h.from_datetime AND h.to_datetime
                    AND problem != 'MicroStop'
                    AND problem != 'Not Given')
                else null
            end as problem,
            h.cause AS causes,
            case
                when (select top 1 actionplan from IoT.dbo.TicketTRX where MchID = @machine_id and TicketDate between @from and @to and problem != 'MicroStop' and problem != 'Not Given') is not null
                then (SELECT STRING_AGG(FORMAT(ticketDate, 'HH:mm') + ' ' + actionplan, ', ') AS ActionList
                    FROM IoT.dbo.TicketTRX
                    WHERE MchID = @machine_id
                    AND TicketDate BETWEEN h.from_datetime AND h.to_datetime
                    AND problem != 'MicroStop'
                    AND problem != 'Not Given')
                else null
            end as action,
            h.note AS comments,
            h.ooe,
            h.scrap,
            h.rework
        FROM IoT.dbo.hourly h
        LEFT JOIN IoT.dbo.countboard_tasks t ON h.task_id = t.id
        LEFT JOIN CooisLatest c ON c.po_name = t.po_name
        WHERE h.machine_id = @machine_id
        AND h.shift_id = @shift_id
        AND h.from_datetime BETWEEN @from AND @to
        ORDER BY h.from_datetime asc;

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
          totalgrey AS grey,
          (select top 1 value from IoT.dbo.parameter_setting where name = 'target_oee_yearly' order by id desc) as targetYearly,
          (select top 1 value from IoT.dbo.parameter_setting where name = 'target_tolerance' order by id desc) as targetTolerance,
          (select top 1 value from IoT.dbo.parameter_setting where name = 'target_tolerance_uv' order by id desc) as targetToleranceUv
      FROM TimeCalculations
    `
    return await queryDatabase(sqlQuery, {machine_id, date, shift})

  } else {
    const sqlQuery = `
    SELECT MchID, timea, pmidle, timeb, breakdown, timee, ooe, oee, breakdownperc, green, red, yellow, white, blue, orange, purple, grey,
    (select top 1 value from IoT.dbo.parameter_setting where name = 'target_oee_yearly' order by id desc) as targetYearly,
    (select top 1 value from IoT.dbo.parameter_setting where name = 'target_tolerance' order by id desc) as targetTolerance,
    (select top 1 value from IoT.dbo.parameter_setting where name = 'target_tolerance_uv' order by id desc) as targetToleranceUv
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
            t.fromTime,
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

    -- 1. Generate time intervals (288 x 5min for 24h)
    IF OBJECT_ID('tempdb..#TimeIntervals') IS NOT NULL DROP TABLE #TimeIntervals;
    WITH Tally AS (
        SELECT TOP (288) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS n
        FROM master.dbo.spt_values a CROSS JOIN master.dbo.spt_values b
    )
    SELECT
        DATEADD(MINUTE, n * 5, @from) AS FromTime
    INTO #TimeIntervals
    FROM Tally;

    -- 2. Get first status before @from
    IF OBJECT_ID('tempdb..#FirstStatus') IS NOT NULL DROP TABLE #FirstStatus;
    SELECT TOP 1
        StatusDate,
        StatusLight,
        MchID
    INTO #FirstStatus
    FROM MchStatusTRX
    WHERE MchID = @machine_id
    AND Active = 1
    AND StatusDate < @from
    ORDER BY StatusDate DESC;

    -- 3. Get all status changes (including previous one)
    IF OBJECT_ID('tempdb..#StatusChanges') IS NOT NULL DROP TABLE #StatusChanges;
    SELECT
        StatusDate AS ChangeTime,
        StatusLight,
        MchID,
        LEAD(StatusDate) OVER (ORDER BY StatusDate) AS NextStatusDate
    INTO #StatusChanges
    FROM (
        SELECT * FROM #FirstStatus
        UNION ALL
        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate BETWEEN @from AND @to
    ) AS AllStatus;

    -- Optional: index for faster filtering
    CREATE CLUSTERED INDEX IX_StatusChanges_ChangeTime ON #StatusChanges(ChangeTime);

    -- 4. Calculate duration overlaps with 5-minute intervals
    IF OBJECT_ID('tempdb..#IntervalStatus') IS NOT NULL DROP TABLE #IntervalStatus;
    SELECT
        t.FromTime,
        s.StatusLight,
        s.MchID,
        DurationSeconds =
            CASE
                WHEN s.ChangeTime <= t.FromTime AND (s.NextStatusDate IS NULL OR s.NextStatusDate > DATEADD(MINUTE, 5, t.FromTime))
                    THEN 300
                WHEN s.ChangeTime <= t.FromTime AND s.NextStatusDate <= DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, t.FromTime, s.NextStatusDate)
                WHEN s.ChangeTime > t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime)
                    AND (s.NextStatusDate IS NULL OR s.NextStatusDate >= DATEADD(MINUTE, 5, t.FromTime))
                    THEN DATEDIFF(SECOND, s.ChangeTime, DATEADD(MINUTE, 5, t.FromTime))
                WHEN s.ChangeTime > t.FromTime AND s.NextStatusDate < DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, s.ChangeTime, s.NextStatusDate)
                ELSE 0
            END
    INTO #IntervalStatus
    FROM #TimeIntervals t
    JOIN #StatusChanges s
    ON (s.ChangeTime <= t.FromTime AND (s.NextStatusDate > t.FromTime OR s.NextStatusDate IS NULL))
    OR (s.ChangeTime >= t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime));

    -- 5. Get max duration per interval
    IF OBJECT_ID('tempdb..#MaxDuration') IS NOT NULL DROP TABLE #MaxDuration;
    SELECT *
    INTO #MaxDuration
    FROM (
        SELECT
            FromTime,
            StatusLight,
            MchID,
            DurationSeconds,
            ROW_NUMBER() OVER (PARTITION BY FromTime ORDER BY DurationSeconds DESC) AS rn
        FROM #IntervalStatus
    ) AS ranked
    WHERE rn = 1;

    -- 6. Final select with conditional pivot
    SELECT
        CASE WHEN StatusLight = 'BLUE' THEN 1 ELSE NULL END AS blue,
        CASE WHEN StatusLight = 'ORANGE' THEN 1 ELSE NULL END AS orange,
        CASE WHEN StatusLight = 'PURPLE' THEN 1 ELSE NULL END AS purple,
        CASE WHEN StatusLight = 'GREY' THEN 1 ELSE NULL END AS grey,
        CASE WHEN StatusLight = 'YELLOW' THEN 1 ELSE NULL END AS yellow,
        CASE WHEN StatusLight = 'WHITE' THEN 1 ELSE NULL END AS white,
        CASE WHEN StatusLight = 'RED' THEN 1 ELSE NULL END AS red,
        CASE WHEN StatusLight = 'GREEN' THEN 1 ELSE NULL END AS green,
        t.fromTime
    FROM #TimeIntervals t
    LEFT JOIN #MaxDuration m
        ON t.FromTime = m.FromTime
    WHERE t.FromTime <= @current
    ORDER BY t.FromTime;

    `
      return await queryDatabase(sqlQuery, { machine_id, shift })
  } else if(date && ems){ // HISTORY EMS

    const sqlQuery = `
    DECLARE @from DATETIME;
    DECLARE @to DATETIME;
    DECLARE @current DATETIME = GETDATE();

    SET @from = DATEADD(HOUR, 0, CAST(@date AS DATETIME));
    SET @to = DATEADD(HOUR, 0, DATEADD(DAY, 1, CAST(@date AS DATETIME)));

    -- 1. Generate time intervals (288 x 5min for 24h)
    IF OBJECT_ID('tempdb..#TimeIntervals') IS NOT NULL DROP TABLE #TimeIntervals;
    WITH Tally AS (
        SELECT TOP (288) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS n
        FROM master.dbo.spt_values a CROSS JOIN master.dbo.spt_values b
    )
    SELECT
        DATEADD(MINUTE, n * 5, @from) AS FromTime
    INTO #TimeIntervals
    FROM Tally;

    -- 2. Get first status before @from
    IF OBJECT_ID('tempdb..#FirstStatus') IS NOT NULL DROP TABLE #FirstStatus;
    SELECT TOP 1
        StatusDate,
        StatusLight,
        MchID
    INTO #FirstStatus
    FROM MchStatusTRX
    WHERE MchID = @machine_id
    AND Active = 1
    AND StatusDate < @from
    ORDER BY StatusDate DESC;

    -- 3. Get all status changes (including previous one)
    IF OBJECT_ID('tempdb..#StatusChanges') IS NOT NULL DROP TABLE #StatusChanges;
    SELECT
        StatusDate AS ChangeTime,
        StatusLight,
        MchID,
        LEAD(StatusDate) OVER (ORDER BY StatusDate) AS NextStatusDate
    INTO #StatusChanges
    FROM (
        SELECT * FROM #FirstStatus
        UNION ALL
        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate BETWEEN @from AND @to
    ) AS AllStatus;

    -- Optional: index for faster filtering
    CREATE CLUSTERED INDEX IX_StatusChanges_ChangeTime ON #StatusChanges(ChangeTime);

    -- 4. Calculate duration overlaps with 5-minute intervals
    IF OBJECT_ID('tempdb..#IntervalStatus') IS NOT NULL DROP TABLE #IntervalStatus;
    SELECT
        t.FromTime,
        s.StatusLight,
        s.MchID,
        DurationSeconds =
            CASE
                WHEN s.ChangeTime <= t.FromTime AND (s.NextStatusDate IS NULL OR s.NextStatusDate > DATEADD(MINUTE, 5, t.FromTime))
                    THEN 300
                WHEN s.ChangeTime <= t.FromTime AND s.NextStatusDate <= DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, t.FromTime, s.NextStatusDate)
                WHEN s.ChangeTime > t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime)
                    AND (s.NextStatusDate IS NULL OR s.NextStatusDate >= DATEADD(MINUTE, 5, t.FromTime))
                    THEN DATEDIFF(SECOND, s.ChangeTime, DATEADD(MINUTE, 5, t.FromTime))
                WHEN s.ChangeTime > t.FromTime AND s.NextStatusDate < DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, s.ChangeTime, s.NextStatusDate)
                ELSE 0
            END
    INTO #IntervalStatus
    FROM #TimeIntervals t
    JOIN #StatusChanges s
    ON (s.ChangeTime <= t.FromTime AND (s.NextStatusDate > t.FromTime OR s.NextStatusDate IS NULL))
    OR (s.ChangeTime >= t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime));

    -- 5. Get max duration per interval
    IF OBJECT_ID('tempdb..#MaxDuration') IS NOT NULL DROP TABLE #MaxDuration;
    SELECT *
    INTO #MaxDuration
    FROM (
        SELECT
            FromTime,
            StatusLight,
            MchID,
            DurationSeconds,
            ROW_NUMBER() OVER (PARTITION BY FromTime ORDER BY DurationSeconds DESC) AS rn
        FROM #IntervalStatus
    ) AS ranked
    WHERE rn = 1;

    -- 6. Final select with conditional pivot
    SELECT
        CASE WHEN StatusLight = 'BLUE' THEN 1 ELSE NULL END AS blue,
        CASE WHEN StatusLight = 'ORANGE' THEN 1 ELSE NULL END AS orange,
        CASE WHEN StatusLight = 'PURPLE' THEN 1 ELSE NULL END AS purple,
        CASE WHEN StatusLight = 'GREY' THEN 1 ELSE NULL END AS grey,
        CASE WHEN StatusLight = 'YELLOW' THEN 1 ELSE NULL END AS yellow,
        CASE WHEN StatusLight = 'WHITE' THEN 1 ELSE NULL END AS white,
        CASE WHEN StatusLight = 'RED' THEN 1 ELSE NULL END AS red,
        CASE WHEN StatusLight = 'GREEN' THEN 1 ELSE NULL END AS green,
        t.fromTime
    FROM #TimeIntervals t
    LEFT JOIN #MaxDuration m
        ON t.fromTime = m.fromTime
    WHERE t.fromTime <= @current
    ORDER BY t.fromTime;


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

    -- 1. Generate time intervals (288 x 5min for 24h)
    IF OBJECT_ID('tempdb..#TimeIntervals') IS NOT NULL DROP TABLE #TimeIntervals;
    WITH Tally AS (
        SELECT TOP (288) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS n
        FROM master.dbo.spt_values a CROSS JOIN master.dbo.spt_values b
    )
    SELECT
        DATEADD(MINUTE, n * 5, @from) AS FromTime
    INTO #TimeIntervals
    FROM Tally;

    -- 2. Get first status before @from
    IF OBJECT_ID('tempdb..#FirstStatus') IS NOT NULL DROP TABLE #FirstStatus;
    SELECT TOP 1
        StatusDate,
        StatusLight,
        MchID
    INTO #FirstStatus
    FROM MchStatusTRX
    WHERE MchID = @machine_id
    AND Active = 1
    AND StatusDate < @from
    ORDER BY StatusDate DESC;

    -- 3. Get all status changes (including previous one)
    IF OBJECT_ID('tempdb..#StatusChanges') IS NOT NULL DROP TABLE #StatusChanges;
    SELECT
        StatusDate AS ChangeTime,
        StatusLight,
        MchID,
        LEAD(StatusDate) OVER (ORDER BY StatusDate) AS NextStatusDate
    INTO #StatusChanges
    FROM (
        SELECT * FROM #FirstStatus
        UNION ALL
        SELECT
            StatusDate,
            StatusLight,
            MchID
        FROM MchStatusTRX
        WHERE MchID = @machine_id
        AND Active = 1
        AND StatusDate BETWEEN @from AND @to
    ) AS AllStatus;

    -- Optional: index for faster filtering
    CREATE CLUSTERED INDEX IX_StatusChanges_ChangeTime ON #StatusChanges(ChangeTime);

    -- 4. Calculate duration overlaps with 5-minute intervals
    IF OBJECT_ID('tempdb..#IntervalStatus') IS NOT NULL DROP TABLE #IntervalStatus;
    SELECT
        t.FromTime,
        s.StatusLight,
        s.MchID,
        DurationSeconds =
            CASE
                WHEN s.ChangeTime <= t.FromTime AND (s.NextStatusDate IS NULL OR s.NextStatusDate > DATEADD(MINUTE, 5, t.FromTime))
                    THEN 300
                WHEN s.ChangeTime <= t.FromTime AND s.NextStatusDate <= DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, t.FromTime, s.NextStatusDate)
                WHEN s.ChangeTime > t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime)
                    AND (s.NextStatusDate IS NULL OR s.NextStatusDate >= DATEADD(MINUTE, 5, t.FromTime))
                    THEN DATEDIFF(SECOND, s.ChangeTime, DATEADD(MINUTE, 5, t.FromTime))
                WHEN s.ChangeTime > t.FromTime AND s.NextStatusDate < DATEADD(MINUTE, 5, t.FromTime)
                    THEN DATEDIFF(SECOND, s.ChangeTime, s.NextStatusDate)
                ELSE 0
            END
    INTO #IntervalStatus
    FROM #TimeIntervals t
    JOIN #StatusChanges s
    ON (s.ChangeTime <= t.FromTime AND (s.NextStatusDate > t.FromTime OR s.NextStatusDate IS NULL))
    OR (s.ChangeTime >= t.FromTime AND s.ChangeTime < DATEADD(MINUTE, 5, t.FromTime));

    -- 5. Get max duration per interval
    IF OBJECT_ID('tempdb..#MaxDuration') IS NOT NULL DROP TABLE #MaxDuration;
    SELECT *
    INTO #MaxDuration
    FROM (
        SELECT
            FromTime,
            StatusLight,
            MchID,
            DurationSeconds,
            ROW_NUMBER() OVER (PARTITION BY FromTime ORDER BY DurationSeconds DESC) AS rn
        FROM #IntervalStatus
    ) AS ranked
    WHERE rn = 1;

    -- 6. Final select with conditional pivot
    SELECT
        CASE WHEN StatusLight = 'BLUE' THEN 1 ELSE NULL END AS blue,
        CASE WHEN StatusLight = 'ORANGE' THEN 1 ELSE NULL END AS orange,
        CASE WHEN StatusLight = 'PURPLE' THEN 1 ELSE NULL END AS purple,
        CASE WHEN StatusLight = 'GREY' THEN 1 ELSE NULL END AS grey,
        CASE WHEN StatusLight = 'YELLOW' THEN 1 ELSE NULL END AS yellow,
        CASE WHEN StatusLight = 'WHITE' THEN 1 ELSE NULL END AS white,
        CASE WHEN StatusLight = 'RED' THEN 1 ELSE NULL END AS red,
        CASE WHEN StatusLight = 'GREEN' THEN 1 ELSE NULL END AS green,
        t.fromTime
    FROM #TimeIntervals t
    LEFT JOIN #MaxDuration m
        ON t.fromTime = m.fromTime
    WHERE t.FromTime <= @current
    ORDER BY t.FromTime;


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
        WHEN NULLIF(ct, 0) IS NOT NULL AND
             (CAST(required_qty AS INT) - CAST(produced_qty AS INT)) >
             (cvt * (8 * 3600.0 / NULLIF(ct, 0)))
        THEN
            FLOOR(cvt * (8 * 3600.0 / NULLIF(ct, 0)))
        ELSE
            CAST(required_qty AS INT) - CAST(produced_qty AS INT)
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
        WHEN NULLIF(ct, 0) IS NOT NULL AND
             (CAST(required_qty AS INT) - CAST(produced_qty AS INT)) >
             (cvt * (8 * 3600.0 / NULLIF(ct, 0)))
        THEN
            FLOOR(cvt * (8 * 3600.0 / NULLIF(ct, 0)))
        ELSE
            CAST(required_qty AS INT) - CAST(produced_qty AS INT)
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
        SET @to = DATEADD(minute, 1, DATEADD(DAY, 1, CAST(@date AS DATETIME))); -- Goes into the next day

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
                    (SELECT TOP 1 StatusLight
                    FROM eEnergy.dbo.PowerMeter
                    WHERE MchID = @machine_name AND TrxType = 'Manual' AND Active = 1
                    AND PMDT < @from ORDER BY id DESC) AS StatusLightBefore,
                    (SELECT TOP 1 StatusLight
                    FROM eEnergy.dbo.PowerMeter
                    WHERE MchID = @machine_name AND TrxType = 'Manual' AND Active = 1
                    AND PMDT < @from ORDER BY id DESC) AS StatusLight,
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
                    ISNULL(LAG(PMDT) OVER (PARTITION BY MchID ORDER BY PMDT), @from) AS BeforePMDT,
                    PMDT,
                    case
						when LAG(PMDT) OVER (PARTITION BY MchID ORDER BY PMDT) is null then
						PMValue -	(select top 1  PMValue from eEnergy.dbo.PowerMeter
							where MchID = @machine_name and TrxType = 'Automatic'
							and PMDT between dateadd(minute,0,@from) and dateadd(minute,1,@from)
							order by PMValue Desc
							)
						else  valueUsed
						end as valueUsed,
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
        SET @to = DATEADD(minute, 1, DATEADD(DAY, 1, cast(CAST(GETDATE() AS date)as datetime))); -- Goes into the next day

    
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
                    (SELECT TOP 1 StatusLight
                    FROM eEnergy.dbo.PowerMeter
                    WHERE MchID = @machine_name AND TrxType = 'Manual' AND Active = 1
                    AND PMDT < @from ORDER BY id DESC) AS StatusLightBefore,
                    (SELECT TOP 1 StatusLight
                    FROM eEnergy.dbo.PowerMeter
                    WHERE MchID = @machine_name AND TrxType = 'Manual' AND Active = 1
                    AND PMDT < @from ORDER BY id DESC) AS StatusLight,
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
                    ISNULL(LAG(PMDT) OVER (PARTITION BY MchID ORDER BY PMDT), @from) AS BeforePMDT,
                    PMDT,
                    case
						when LAG(PMDT) OVER (PARTITION BY MchID ORDER BY PMDT) is null then
						PMValue -	(select top 1  PMValue from eEnergy.dbo.PowerMeter
							where MchID = @machine_name and TrxType = 'Automatic'
							and PMDT between dateadd(minute,0,@from) and dateadd(minute,1,@from)
							order by PMValue Desc
							)
						else  valueUsed
						end as valueUsed,
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
    const hardcodedBudgetCase = `case when @machine_name = 'MT280100' then 7300 
            when @machine_name = 'JW220004' then 10300
            when @machine_name = 'BR320109' then 5691
            else 0
            end`;
    const budgetEnergyExpr = `COALESCE(NULLIF(m.energyBudget, 0), ${hardcodedBudgetCase})`;
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
            , ${budgetEnergyExpr} as budgetEnergyPerJam
        FROM IoT.dbo.mchstatustrx t
        LEFT JOIN IoT.dbo.MachineMST m ON m.MchID = @machine_name
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
            , ${budgetEnergyExpr} as budgetEnergyPerJam
        FROM IoT.dbo.mchstatustrx t
        LEFT JOIN IoT.dbo.MachineMST m ON m.MchID = @machine_name
        CROSS JOIN TimeCalculations
        WHERE t.MchID = @machine_name
        ORDER BY t.ID DESC;

      `;
      return await queryDatabase(sqlQuery, { machine_name });
    }
  }

export async function makeMachineGrey(machineId: string) {
      const sqlQuery = `
        UPDATE IoT.dbo.MachineMST SET is_override = 1, MchStatus = 'TRIAL' WHERE MchID = @machineId;
  
        INSERT INTO IoT.dbo.MchStatusTRX (MchID, StatusDate, StatusLight, Active)
        VALUES (@machineId, GETDATE(), 'GREY', 1);
    `;
    return await queryDatabase(sqlQuery, { machineId });
}

export async function makeMachineTAO(machineId: string) {
    const sqlQuery = `
      UPDATE IoT.dbo.MachineMST SET is_override = 1, MchStatus = 'TAO' WHERE MchID = @machineId;

      INSERT INTO IoT.dbo.MchStatusTRX (MchID, StatusDate, StatusLight, Active)
      VALUES (@machineId, GETDATE(), 'WHITE', 1);
    `;
    return await queryDatabase(sqlQuery, { machineId });
}
export async function removeOverrideTAO(machineId: string) {
    const sqlQuery = `
    DECLARE @statusLightBefore VARCHAR(50);

    SET @statusLightBefore = (select top 1 StatusLight from IoT.dbo.MchStatusTRX where MchID = @machineId  and Active = 1 and (StatusLight != 'WHITE' and StatusLight != 'GREY') order by ID desc);

    UPDATE IoT.dbo.MachineMST SET is_override = 0, MchStatus = NULL WHERE MchID = @machineId;

    INSERT INTO IoT.dbo.MchStatusTRX (MchID, StatusDate, StatusLight, Active)
    VALUES (@machineId, GETDATE(), @statusLightBefore, 1);

      SELECT @statusLightBefore as statusLightBefore;
    `;
      return await queryDatabase(sqlQuery, { machineId });
  }

  export async function addMachineState(machineId: string, color: string, statusDate?: string | null) {
        const sqlQuery = `
          INSERT INTO IoT.dbo.MchStatusTRX (MchID, StatusDate, StatusLight, Active)
          VALUES (@machineId, COALESCE(@statusDate, GETDATE()), @color, 1);
        `;
        return await queryDatabase(sqlQuery, { machineId, color, statusDate });
    }

  export async function updateMachineStateColorById(stateId: string, color: string) {
        const sqlQuery = `
          UPDATE IoT.dbo.MchStatusTRX
          SET StatusLight = @color
          WHERE ID = @stateId;
        `;
        return await queryDatabase(sqlQuery, { stateId, color });
    }

export async function removeOverride(machineId: string) {
    const sqlQuery = `
    DECLARE @statusLightBefore VARCHAR(50);

    SET @statusLightBefore = (select top 1 StatusLight from IoT.dbo.MchStatusTRX where MchID = @machineId  and Active = 1 and (StatusLight != 'GREY' and StatusLight != 'WHITE') order by ID desc);

    UPDATE IoT.dbo.MachineMST SET is_override = 0, MchStatus = NULL WHERE MchID = @machineId;

    INSERT INTO IoT.dbo.MchStatusTRX (MchID, StatusDate, StatusLight, Active)
    VALUES (@machineId, GETDATE(), @statusLightBefore, 1);

    SELECT @statusLightBefore as statusLightBefore;
  `;
    return await queryDatabase(sqlQuery, { machineId });
}

export async function getTrendWeekly(date_from: string, date_to: string, uap: string) {
    const sqlQuery = `
    WITH cte AS (
        SELECT
            DATEADD(hour, 0, amr.created_at) AS created_at,
            DATEPART(ISO_WEEK, DATEADD(hour, 0, amr.created_at)) AS week_number,
            DATEPART(YEAR, DATEADD(hour, 0, amr.created_at)) AS year_number,
            amr.shift AS "Shift",
            m."MchNumber",
            m."MchLoc",
            m."UAP",
            m.MchDesc,
            m.MchTon,
            amr.ooe AS "OOE",
            amr.oee AS "OEE",
            amr.green AS "GREEN",
            amr.yellow AS "YELLOW",
            amr.red AS "RED",
            amr.white AS "WHITE",
            amr.purple AS "PURPLE",
            amr.grey AS "GREY",
            amr.orange AS "ORANGE",
            amr.blue AS "BLUE"
        FROM
            dbo.andon_monitoring_report amr
        JOIN
            dbo.machinemst m ON amr.machine_id = m."MchID"
        WHERE
            (amr.machine_id IS NOT NULL OR amr.machine_id != '')
            AND amr.created_at BETWEEN @date_from AND @date_to
            AND amr.shift NOT IN (0, 9)
            AND m."UAP" IS NOT NULL
            AND m."UAP" != ''
    )
    SELECT
        CONCAT(year_number, '-', week_number) AS week,
        MchNumber,
        MchLoc,
        UAP,
        cast(AVG(OOE) as float) AS OOE,
        cast(AVG(OEE) as float) AS OEE,
        MchDesc,
        MchTon,
        cast(AVG(
            CASE
                WHEN (green + yellow + red + white + purple + orange + grey + blue) = 0 THEN 0
                ELSE (yellow + red + white + purple + orange + grey + blue) * 1.0 /
                    (green + yellow + red + white + purple + orange + grey + blue)
            END
        ) as float) AS NonOOE,

        cast(AVG(
            CASE
                WHEN (green + yellow + red + white + purple + orange + grey + blue) = 0 THEN 0
                ELSE white * 1.0 /
                    (green + yellow + red + white + purple + orange + grey + blue)
            END
        ) as float) AS PlannedStoppage,

        cast(AVG(
            CASE
                WHEN (green + yellow + red + white + purple + orange + grey + blue) = 0 THEN 0
                ELSE orange * 1.0 /
                    (green + yellow + red + white + purple + orange + grey + blue)
            END
        ) as float) AS Breakdown,

        cast(AVG(
            CASE
                WHEN (green + yellow + red + white + purple + orange + grey + blue) = 0 THEN 0
                ELSE yellow * 1.0 /
                    (green + yellow + red + white + purple + orange + grey + blue)
            END
        ) as float) AS MicroStop,

        cast(AVG(
            CASE
                WHEN (green + yellow + red + white + purple + orange + grey + blue) = 0 THEN 0
                ELSE red * 1.0 /
                    (green + yellow + red + white + purple + orange + grey + blue)
            END
        ) as float) AS NonQuality,

        cast(AVG(
            CASE
                WHEN (green + yellow + red + white + purple + orange + grey + blue) = 0 THEN 0
                ELSE purple * 1.0 /
                    (green + yellow + red + white + purple + orange + grey + blue)
            END
        ) as float) AS OrgDisfunction,

        cast(AVG(
            CASE
                WHEN (green + yellow + red + white + purple + orange + grey + blue) = 0 THEN 0
                ELSE blue * 1.0 /
                    (green + yellow + red + white + purple + orange + grey + blue)
            END
        ) as float) AS SMED,

        cast(AVG(
            CASE
                WHEN (green + yellow + red + white + purple + orange + grey + blue) = 0 THEN 0
                ELSE grey * 1.0 /
                    (green + yellow + red + white + purple + orange + grey + blue)
            END
        ) as float) AS Other

    FROM
        cte
    WHERE
        (@uap = 'ALL' OR UAP = @uap)
    GROUP BY
        year_number, week_number, MchNumber, MchLoc, UAP, MchDesc, MchTon
    ORDER BY
        year_number, week_number

    `;
    return await queryDatabase(sqlQuery, { date_from, date_to, uap });
}

export async function getTrendStream(c: Context, date_from: string, date_to: string) {
    const encoder = new TextEncoder();
    let first = true;
    const sqlQuery = `
    WITH AllMachines AS (
        SELECT DISTINCT MchID
        FROM MachineMST
        WHERE Active = 1
        AND UAP in ('BASIC','PREMIUM','LEAN')
    ),
    DateRange AS (
        SELECT DATEADD(DAY, number, @date_from) AS ReportDate
        FROM master.dbo.spt_values
        WHERE type = 'P'
        AND number BETWEEN 0 AND DATEDIFF(DAY, @date_from, @date_to)
    ),
    MachinesByDate AS (
        -- Cross join to get all machines for each date
        SELECT
            dr.ReportDate AS created_at_day,
            am.MchID
        FROM DateRange dr
        CROSS JOIN AllMachines am
    ),
    -- Get the last status before start date for each machine
    LastStatusBeforeStart AS (
        SELECT
            MchID,
            StatusDate,
            StatusLight
        FROM (
            SELECT
                MchID,
                StatusDate,
                StatusLight,
                ROW_NUMBER() OVER(PARTITION BY MchID ORDER BY StatusDate DESC) AS rn
            FROM MchStatusTRX
            WHERE Active = 1
            AND StatusDate < @date_from
        ) x
        WHERE rn = 1
    ),
    -- Combine with statuses within date range
    CombinedStatuses AS (
        -- Include last status before start date
        SELECT
            MchID,
            StatusDate,
            StatusLight,
            1 AS IsBeforeStart
        FROM LastStatusBeforeStart

        UNION ALL

        -- Include all statuses within date range
        SELECT
            MchID,
            StatusDate,
            StatusLight,
            0 AS IsBeforeStart
        FROM MchStatusTRX
        WHERE Active = 1
        AND StatusDate BETWEEN @date_from AND @date_to
    ),
    StatusData AS (
        SELECT
            s.MchID,
            s.StatusDate,
            s.StatusLight,
            LEAD(s.StatusDate) OVER (PARTITION BY s.MchID ORDER BY s.StatusDate) AS todate,
            s.IsBeforeStart
        FROM CombinedStatuses s
    ),
    -- This CTE creates day-by-day status records by splitting records that cross day boundaries
    CrossDayStatusRecords AS (
        -- Status records that start before the period
        SELECT
            s.MchID,
            s.StatusLight,
            d.dt AS StatusDay,
            CASE
                WHEN s.IsBeforeStart = 1 THEN @date_from
                ELSE
                    CASE
                        WHEN s.StatusDate > d.dt THEN s.StatusDate
                        ELSE d.dt
                    END
            END AS DayStart,
            CASE
                WHEN COALESCE(s.todate, @date_to) < DATEADD(DAY, 1, d.dt) THEN COALESCE(s.todate, @date_to)
                ELSE DATEADD(DAY, 1, d.dt)
            END AS DayEnd
        FROM StatusData s
        CROSS APPLY (
            -- Generate a series of dates that this status record spans
            SELECT DATEADD(DAY, n.number,
                CASE
                    WHEN s.IsBeforeStart = 1 THEN @date_from
                    ELSE CAST(s.StatusDate AS DATE)
                END) AS dt
            FROM master.dbo.spt_values n
            WHERE n.type = 'P'
            AND n.number BETWEEN 0 AND
                DATEDIFF(DAY,
                    CASE
                        WHEN s.IsBeforeStart = 1 THEN @date_from
                        ELSE CAST(s.StatusDate AS DATE)
                    END,
                    CAST(COALESCE(s.todate, @date_to) AS DATE))
        ) d
        WHERE d.dt BETWEEN @date_from AND @date_to
    ),
    StatusHoursPerDay AS (
        SELECT
            CAST(StatusDay AS DATE) AS StatusDay,
            MchID,
            StatusLight,
            -- Calculate hours within each day
            DATEDIFF(SECOND, DayStart, DayEnd) / 3600.0 AS hours
        FROM CrossDayStatusRecords
    ),
    DailyCalculations AS (
        SELECT
            StatusDay AS status_date,
            MchID,
            SUM(CASE WHEN StatusLight = 'GREEN' THEN hours ELSE 0 END) AS green,
            SUM(CASE WHEN StatusLight = 'YELLOW' THEN hours ELSE 0 END) AS yellow,
            SUM(CASE WHEN StatusLight = 'RED' THEN hours ELSE 0 END) AS red,
            SUM(CASE WHEN StatusLight = 'WHITE' THEN hours ELSE 0 END) AS white,
            SUM(CASE WHEN StatusLight = 'PURPLE' THEN hours ELSE 0 END) AS purple,
            SUM(CASE WHEN StatusLight = 'GREY' THEN hours ELSE 0 END) AS grey,
            SUM(CASE WHEN StatusLight = 'ORANGE' THEN hours ELSE 0 END) AS orange,
            SUM(CASE WHEN StatusLight = 'BLUE' THEN hours ELSE 0 END) AS blue
        FROM StatusHoursPerDay
        GROUP BY StatusDay, MchID
    ),
    MachineStatusByDate AS (
        SELECT
            mbd.created_at_day,
            mbd.MchID,
            COALESCE(dc.green, 0) AS green,
            COALESCE(dc.yellow, 0) AS yellow,
            COALESCE(dc.red, 0) AS red,
            COALESCE(dc.white, 0) AS white,
            COALESCE(dc.purple, 0) AS purple,
            COALESCE(dc.grey, 0) AS grey,
            COALESCE(dc.orange, 0) AS orange,
            COALESCE(dc.blue, 0) AS blue
        FROM MachinesByDate mbd
        LEFT JOIN DailyCalculations dc ON mbd.created_at_day = dc.status_date AND mbd.MchID = dc.MchID
    ),
    -- Cap total hours per machine per day to 24 hours if needed
    CappedMachineStatus AS (
        SELECT
            created_at_day,
            MchID,
            green,
            yellow, red, white, purple, grey, orange, blue
        FROM MachineStatusByDate
    )
    SELECT
        CAST(c.created_at_day AS DATE) AS report_date,
        CAST(c.MchID AS NVARCHAR(100)) AS MchID,
        CAST(m.MchDesc AS NVARCHAR(100)) AS mchdesc,
        CAST(m.MchTon AS NVARCHAR(100)) AS mchtonage,
        CAST(m.UAP AS NVARCHAR(100)) AS mchuap,
        CAST(m.MchLoc AS NVARCHAR(100)) AS mchloc,
        CAST(m.MchNumber AS NVARCHAR(100)) AS mchnumber,
        CAST(ISNULL(CAST(c.green AS FLOAT) * 60, 0.0) AS FLOAT) AS green_minutes,
        CAST(ISNULL(CAST(c.yellow AS FLOAT) * 60, 0.0) AS FLOAT) AS yellow_minutes,
        CAST(ISNULL(CAST(c.red AS FLOAT) * 60, 0.0) AS FLOAT) AS red_minutes,
        CAST(ISNULL(CAST(c.white AS FLOAT) * 60, 0.0) AS FLOAT) AS white_minutes,
        CAST(ISNULL(CAST(c.purple AS FLOAT) * 60, 0.0) AS FLOAT) AS purple_minutes,
        CAST(ISNULL(CAST(c.grey AS FLOAT) * 60, 0.0) AS FLOAT) AS grey_minutes,
        CAST(ISNULL(CAST(c.orange AS FLOAT) * 60, 0.0) AS FLOAT) AS orange_minutes,
        CAST(ISNULL(CAST(c.blue AS FLOAT) * 60, 0.0) AS FLOAT) AS blue_minutes
    FROM CappedMachineStatus c
    LEFT JOIN MachineMST m ON m.MchID = c.MchID
    WHERE c.created_at_day BETWEEN @date_from AND @date_to
    ORDER BY c.created_at_day, c.MchID;
    `;
    const stream = new ReadableStream({
        async start(controller) {
            controller.enqueue(encoder.encode('[')); // Start JSON array

            await streamQuery(
                sqlQuery,
                { date_from, date_to },
                (row) => {
                    const chunk = encoder.encode((first ? '' : ',') + JSON.stringify(row));
                    controller.enqueue(chunk);
                    first = false;
                }
            );

            controller.enqueue(encoder.encode(']')); // End JSON array
            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
