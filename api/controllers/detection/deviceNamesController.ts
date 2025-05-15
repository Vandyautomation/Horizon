import { queryDatabase } from "@/api/utils/queryDatabase";

export async function getDeviceNames() {
    const query = `
        SELECT * FROM device_names
    `;
    const result = await queryDatabase(query);
    return result;
}

export async function createDeviceName(name: string, value: string, machine_id: string) {
    const query = `
        INSERT INTO device_names (name, value, machine_id) VALUES (@name, @value, @machine_id)
    `;
    const result = await queryDatabase(query, { name, value, machine_id });
    return result;
}

export async function updateDeviceName(id: string, name: string, value: string, machine_id: string) {
    const query = `
        UPDATE device_names SET name = @name, value = @value, machine_id = @machine_id WHERE id = @id
    `;
    const result = await queryDatabase(query, { name, value, machine_id, id });
    return result;
}

export async function deleteDeviceName(id: string) {
    const query = `
        DELETE FROM device_names WHERE id = @id
    `;
    const result = await queryDatabase(query, { id });
    return result;
}