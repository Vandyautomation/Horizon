
import { queryDatabase } from "@/api/utils/queryDatabase";

export async function getYaml() {
    const query = `
        SELECT * FROM yaml_files
    `;
    const result = await queryDatabase(query);
    return result;
}

export async function createYaml(name: string, yaml_file: string, yaml_file_content: string) {
    const query = `
        INSERT INTO yaml_files (name, yaml_file, yaml_file_content) VALUES (@name, @yaml_file, @yaml_file_content)
    `;
    const result = await queryDatabase(query, { name, yaml_file, yaml_file_content });
    return result;
}

export async function updateYaml(id: string, name: string, yaml_file: string, yaml_file_content: string) {
    const query = `
        UPDATE yaml_files SET name = @name, yaml_file = @yaml_file, yaml_file_content = @yaml_file_content WHERE id = @id
    `;
    const result = await queryDatabase(query, { name, yaml_file, yaml_file_content, id });
    return result;
}

export async function deleteYaml(id: string) {
    const query = `
        DELETE FROM yaml_files WHERE id = @id
    `;
    const result = await queryDatabase(query, { id });
    return result;
}
