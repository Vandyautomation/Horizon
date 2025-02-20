import { Context } from 'hono';
import { queryDatabase } from '../utils/queryDatabase';



export async function getBuildings() {

    const getMachineBldG = await queryDatabase(`
        SELECT MchNumber as id, (select top 1 
        case 
        when StatusLight = 'GREEN' then 'Running'
        when StatusLight = 'ORANGE' then 'Breakdown'
        when StatusLight = 'PURPLE' then 'OrgDisfunction'
        when StatusLight = 'BLUE' then 'Changeover'
        when StatusLight = 'WHITE' then 'PlannedStop'
        when StatusLight = 'RED' then 'NonQuality'
        when StatusLight = 'YELLOW' then 'Microstop'
        end
        from IoT.dbo.MchStatusTRX where MchID = m.MchID order by id desc) as status, [position], rotation 
        FROM IoT.dbo.MachineMST m where MchLoc = 'INJ Bld G' order by cast(MchNumber as int);
    `, {});
    
    // Convert position and rotation to arrays
    const formattedMachines = getMachineBldG.map((machine: any) => ({
        ...machine,
        position: JSON.parse(machine.position), // Convert string to array
        rotation: JSON.parse(machine.rotation)
    }));
    
    const result = [
        {
            id: '1',
            name: 'INJ Bld G',
            machines: formattedMachines
        }
    ];
    
    return result;
    

}
