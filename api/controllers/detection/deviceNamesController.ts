import { queryDatabase } from "@/api/utils/queryDatabase";

export async function getDeviceNames() {
    const query = `
        SELECT * FROM device_names
    `;
    const result = await queryDatabase(query);
    return result;
}

export async function createDeviceName(name: string, value: string) {
    const query = `
        INSERT INTO device_names (name, value) VALUES (@name, @value)
    `;
    const result = await queryDatabase(query, { name, value });
    return result;
}

export async function updateDeviceName(id: string, name: string, value: string) {
    const query = `
        UPDATE device_names SET name = @name, value = @value WHERE id = @id
    `;
    const result = await queryDatabase(query, { name, value, id });
    return result;
}

export async function deleteDeviceName(id: string) {
    const query = `
        DELETE FROM device_names WHERE id = @id
    `;
    const result = await queryDatabase(query, { id });
    return result;
}