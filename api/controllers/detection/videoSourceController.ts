import { queryDatabase } from "@/api/utils/queryDatabase";

export async function getVideoSources() {
    const query = `
        SELECT * FROM video_sources
    `;
    const result = await queryDatabase(query);
    return result;
}

export async function createVideoSource(name: string, url: string) {
    const query = `
        INSERT INTO video_sources (name, url) VALUES (@name, @url)
    `;
    const result = await queryDatabase(query, { name, url });
    return result;
}

export async function updateVideoSource(id: string, name: string, url: string) {
    const query = `
        UPDATE video_sources SET name = @name, url = @url WHERE id = @id
    `;
    const result = await queryDatabase(query, { name, url, id });
    return result;
}

export async function deleteVideoSource(id: string) {
    const query = `
        DELETE FROM video_sources WHERE id = @id
    `;
    const result = await queryDatabase(query, { id });
    return result;
}