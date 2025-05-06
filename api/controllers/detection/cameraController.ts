import { queryDatabase } from "@/api/utils/queryDatabase";

export async function getCameras() {
    const query = `
        SELECT * FROM cameras WHERE is_active = 1
    `;
    const result = await queryDatabase(query);
    return result;
}

export async function createCamera(name: string, video_source: string, yaml_file: string, yaml_file_content: string, udp_ip: string, udp_port: number, device_name: string, is_active: boolean, is_paused: boolean) {
    const query = `
        INSERT INTO cameras (name, video_source, yaml_file, yaml_file_content, udp_ip, udp_port, device_name, is_active, is_paused) VALUES (@name, @video_source, @yaml_file, @yaml_file_content, @udp_ip, @udp_port, @device_name, @is_active, @is_paused)
    `;
    const result = await queryDatabase(query, { name, video_source, yaml_file, yaml_file_content, udp_ip, udp_port, device_name, is_active, is_paused });
    return result;
}

export async function updateCamera(id: string, name: string, video_source: string, yaml_file: string, yaml_file_content: string, udp_ip: string, udp_port: number, device_name: string, is_active: boolean, is_paused: boolean) {
    const query = `
        UPDATE cameras SET name = @name, video_source = @video_source, yaml_file = @yaml_file, yaml_file_content = @yaml_file_content, udp_ip = @udp_ip, udp_port = @udp_port, device_name = @device_name, is_active = @is_active, is_paused = @is_paused WHERE id = @id
    `;
    const result = await queryDatabase(query, { id, name, video_source, yaml_file, yaml_file_content, udp_ip, udp_port, device_name, is_active, is_paused });
    return result;
}

export async function deleteCamera(id: string) {
    const query = `
        DELETE FROM cameras WHERE id = @id
    `;
    const result = await queryDatabase(query, { id });
    return result;
}