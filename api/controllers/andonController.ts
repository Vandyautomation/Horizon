import { Context } from 'hono';
import { queryDatabase } from '../utils/queryDatabase';

export async function getBuildings(type?: string) {
    const listBuilding = (type == 'injection' ? `'INJ Bld G', 'INJ Bld H', 'INJ Bld J', 'INJ Bld Q', 'INJ Bld R', 'INJ Bld S'` : `'M', 'E', 'K', 'SP'`)
    const sqlQuery =
        `
        DECLARE @from datetime;
        DECLARE @shift int;
    
        set @shift = case when DATEPART(HOUR, GETDATE()) between 5 and 13 then 1 when DATEPART(HOUR, GETDATE()) between 14 and 22 then 2 else 3 end

        -- Set @from and @to based on shift_id
        IF @shift = 1
        BEGIN
            SET @from = DATEADD(HOUR, 6, cast(CAST(GETDATE() AS date)as datetime)); 
        END
        ELSE IF @shift = 2
        BEGIN
            SET @from = DATEADD(HOUR, 14,cast(CAST(GETDATE() AS date)as datetime)) 
        END
        ELSE IF @shift = 3
        BEGIN
            SET @from = DATEADD(HOUR, 22, cast(CAST(GETDATE() AS date)as datetime))
        END
        SELECT 
        m.MchNumber AS id, 
        m.MchLoc AS building,
        m.[position],
        m.rotation,
        m.MchID,
        m.MchDesc,
        m.MchLoc,
        m.MchNumber,
        m.MchTon as Tonage,
        (SELECT SUM(Diff) AS consumption
        FROM (
            SELECT 
                MchID COLLATE SQL_Latin1_General_CP1_CI_AS AS MchID,
                PMValue - LAG(PMValue) OVER (PARTITION BY MchID ORDER BY id) AS Diff
            FROM eEnergy.dbo.PowerMeter
            WHERE TrxType = 'Automatic' and PMDT BETWEEN @from AND GETDATE()
        ) t
        WHERE Diff IS NOT NULL 
        AND MchID = m.MchID COLLATE SQL_Latin1_General_CP1_CI_AS
        GROUP BY MchID
        ) AS consumption,
        (select top 1 actual_ct from countboard_tasks t where t.machine_name = MchDesc order by id desc) AS cycletime,
        (select top 1 ct from countboard_tasks t where t.machine_name = MchDesc order by id desc) AS target_cycletime,
        (select top 1 actual_cvt from countboard_tasks t where t.machine_name = MchDesc order by id desc) AS cavity,
        (select top 1 cvt from countboard_tasks t where t.machine_name = MchDesc order by id desc) AS target_cavity,
        (select top 1 oee from MachineData md where md.MchID = m.MchID order by id desc) AS oee,
        (select top 1 ooe from MachineData md where md.MchID = m.MchID order by id desc) AS ooe
    FROM IoT.dbo.MachineMST m 
    WHERE MchLoc IN (${listBuilding}) and m.Active = 1
    ORDER BY MchLoc, CAST(m.MchNumber AS INT);
    `
    // console.log(sqlQuery)

    const machines = await queryDatabase(sqlQuery, {});
    // Convert position and rotation to arrays for all machines
    if (machines.position == '' || machines.rotation == '') {
        machines.position = null;
        machines.rotation = null;
    }
    const formattedMachines = machines.map((machine: any) => ({
        ...machine,
        position: JSON.parse(machine.position),
        rotation: JSON.parse(machine.rotation)
    }));

    // Group machines by building
    const buildingGroups: { [key: string]: any[] } = {};


    if (type === 'injection') {
        formattedMachines.forEach((machine: any) => {
            const building = machine.building;
            if (!buildingGroups[building]) {
                buildingGroups[building] = [];
            }
            buildingGroups[building].push(machine);
        });
    }

    if (type === 'uv') {
        buildingGroups['All'] = [...formattedMachines];
    }

    // If type is 'uv', create an "All" group with all machines


    
    // Create result array with one entry per building
    const result = Object.entries(buildingGroups).map(([name, machines]) => ({
        id: Math.random().toString(36).substring(2, 10),
        name,
        machines,
        oee: machines.reduce((acc, machine) => acc + (machine.oee || 0), 0) / machines.length,
        ooe: machines.reduce((acc, machine) => acc + (machine.ooe || 0), 0) / machines.length,
    }));
    // console.log(result)
    // console.log(machines)
    // for (const machine of formattedMachines) {
    //     delete machine.position
    //     delete machine.rotation
    //     delete machine.oee
    //     delete machine.ooe
    //     delete machine.cycletime
    //     delete machine.target_cycletime
    //     delete machine.cavity
    //     delete machine.target_cavity
    //     delete machine.consumption
    //     delete machine.building
    // }
    return result;


}
