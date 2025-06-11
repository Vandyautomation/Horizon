import { queryDatabase } from "@/api/utils/queryDatabase";

export async function getCameras() {
    const query = `
        SELECT c.*, y.content as yaml_file_content FROM cameras c
        left join yaml_files y on y.name = c.yaml_file WHERE c.is_active = 1
    `;
    const result = await queryDatabase(query);
    return result;
}

export async function getCamerasByMachineId(machine_id: string) {
    const query = `
        SELECT c.*, y.content as yaml_file_content 
        FROM cameras c
        left join yaml_files y on y.name = c.yaml_file 
        left join device_names dn on dn.value = c.device_name
        WHERE c.is_active = 1
        AND dn.machine_id = @machine_id
    `;
    const result = await queryDatabase(query, { machine_id });
    return result;
}

export async function createCamera(name: string, video_source: string, yaml_file: string, udp_ip: string, udp_port: number, device_name: string, threshold: number) {
    const query = `
        INSERT INTO cameras (name, video_source, yaml_file, udp_ip, udp_port, device_name, is_active, threshold) VALUES (@name, @video_source, @yaml_file, @udp_ip, @udp_port, @device_name, 1, @threshold)
        -- get id of the camera using scope identity
        SELECT SCOPE_IDENTITY() as id
    `;
    const result = await queryDatabase(query, { name, video_source, yaml_file, udp_ip, udp_port, device_name, threshold });
    return result;
}

export async function updateCamera(id: string, name: string, video_source: string, yaml_file: string, udp_ip: string, udp_port: number, device_name: string, threshold: number) {
    const query = `
        UPDATE cameras SET name = @name, video_source = @video_source, yaml_file = @yaml_file, udp_ip = @udp_ip, udp_port = @udp_port, device_name = @device_name, threshold = @threshold WHERE id = @id
    `;
    const result = await queryDatabase(query, { id, name, video_source, yaml_file, udp_ip, udp_port, device_name, threshold });
    return result;
}

export async function deleteCamera(id: string) {
    const query = `
        DELETE FROM cameras WHERE id = @id
    `;
    const result = await queryDatabase(query, { id });
    return result;
}