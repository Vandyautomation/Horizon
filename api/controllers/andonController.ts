import { Context } from 'hono';
import { queryDatabase } from '../utils/queryDatabase';

export async function getBuildings() {
    const machines = await queryDatabase(`
        SELECT 
            MchNumber as id, 
            MchLoc as building,
            (select top 1 
                case 
                    when StatusLight = 'GREEN' then 'Running'
                    when StatusLight = 'ORANGE' then 'Breakdown'
                    when StatusLight = 'PURPLE' then 'OrgDisfunction'
                    when StatusLight = 'BLUE' then 'Changeover'
                    when StatusLight = 'WHITE' then 'PlannedStop'
                    when StatusLight = 'RED' then 'NonQuality'
                    when StatusLight = 'YELLOW' then 'Microstop'
                end
            from IoT.dbo.MchStatusTRX where MchID = m.MchID order by id desc) as status, 
            [position], 
            rotation, 
            m.MchID,
            m.MchLoc,
            m.MchNumber,
            123.23 as consumption
        FROM IoT.dbo.MachineMST m 
        where MchLoc in ('INJ Bld G', 'INJ Bld H', 'INJ Bld J', 'INJ Bld Q', 'INJ Bld R', 'INJ Bld S') 
        order by MchLoc, cast(MchNumber as int);
    `, {});
    
    // Convert position and rotation to arrays for all machines
    const formattedMachines = machines.map((machine: any) => ({
        ...machine,
        position: JSON.parse(machine.position),
        rotation: JSON.parse(machine.rotation)
    }));
    
    // Group machines by building
    const buildingGroups: { [key: string]: any[] } = {};
    formattedMachines.forEach((machine: any) => {
        const building = machine.building;
        if (!buildingGroups[building]) {
            buildingGroups[building] = [];
        }
        buildingGroups[building].push(machine);
    });
    
    // Create result array with one entry per building
    const result = Object.entries(buildingGroups).map(([name, machines], index) => ({
        id: (index + 1).toString(),
        name,
        machines
    }));
    
    return result;
}
