const pool = require('../config/database');

async function upsert({ videoId, imageUrl, driveFileId }, db = pool) {
    const query = `
        INSERT INTO video_images (video_id, image_url, drive_file_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (video_id)
        DO UPDATE SET
            image_url = EXCLUDED.image_url,
            drive_file_id = EXCLUDED.drive_file_id,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id, video_id, image_url, drive_file_id, created_at, updated_at
    `;
    const result = await db.query(query, [videoId, imageUrl, driveFileId]);
    return result.rows[0];
}

async function findByVideoId(videoId, db = pool) {
    const query = `
        SELECT id, video_id, image_url, drive_file_id, created_at, updated_at
        FROM video_images
        WHERE video_id = $1
    `;
    const result = await db.query(query, [videoId]);
    return result.rows[0];
}

module.exports = {
    upsert,
    findByVideoId
};