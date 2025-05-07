
import { queryDatabase } from "@/api/utils/queryDatabase";

export async function getYaml() {
    const query = `
        SELECT * FROM yaml_files
    `;
    const result = await queryDatabase(query);
    return result;
}

export async function createYaml(name: string, content: string) {
    const query = `
        INSERT INTO yaml_files (name, content) VALUES (@name, @content)
    `;
    const result = await queryDatabase(query, { name, content });
    return result;
}

export async function updateYaml(name: string, content: string) {
    const query = `
        UPDATE yaml_files SET  content = @content WHERE name = @name

    `;
    const result = await queryDatabase(query, { name, content });
    return result;
}

export async function deleteYaml(id: string) {
    const query = `
        DELETE FROM yaml_files WHERE id = @id
    `;
    const result = await queryDatabase(query, { id });
    return result;
}

export async function handleYaml(action: string, name: string, content: string) {
    if (action === "create") {
        return await createYaml(name, content);
    } else if (action === "update") {
        return await updateYaml(name, content);
    }
}
