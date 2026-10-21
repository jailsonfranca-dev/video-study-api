const pool = require('../config/database');
const AppError = require('../errors/AppError');

async function listByVideoId(videoId) {
    const { rows } = await pool.query(`
        SELECT id, video_id, drive_file_id, image_url, position, created_at
        FROM video_image_pages
        WHERE video_id = $1
        ORDER BY position ASC, id ASC
    `, [videoId]);
    return rows;
}

async function findByIdAndVideoId(videoId, pageId) {
    const { rows } = await pool.query(`
        SELECT id, video_id, drive_file_id, image_url, position, created_at
        FROM video_image_pages
        WHERE video_id = $1 AND id = $2
    `, [videoId, pageId]);
    return rows[0] || null;
}

/** Bloqueia o vídeo durante a numeração para evitar páginas duplicadas. */
async function appendPage({ videoId, driveFileId, imageUrl }) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT id FROM videos WHERE id = $1 FOR UPDATE', [videoId]);

        const countResult = await client.query(`
            SELECT COUNT(*)::int AS total, COALESCE(MAX(position), 0)::int AS last_position
            FROM video_image_pages WHERE video_id = $1
        `, [videoId]);
        const { total, last_position: lastPosition } = countResult.rows[0];
        if (total >= 30) {
            throw new AppError('Limite de 30 imagens por aula atingido.', 400);
        }

        const { rows } = await client.query(`
            INSERT INTO video_image_pages (video_id, drive_file_id, image_url, position)
            VALUES ($1, $2, $3, $4)
            RETURNING id, video_id, drive_file_id, image_url, position, created_at
        `, [videoId, driveFileId, imageUrl, lastPosition + 1]);

        await client.query('COMMIT');
        return rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function isLegacyImage(videoId, driveFileId) {
    const { rows } = await pool.query(`
        SELECT 1 FROM video_images
        WHERE video_id = $1 AND drive_file_id = $2
        LIMIT 1
    `, [videoId, driveFileId]);
    return rows.length > 0;
}

async function deleteByIdAndVideoId(videoId, pageId) {
    const { rows } = await pool.query(`
        DELETE FROM video_image_pages
        WHERE video_id = $1 AND id = $2
        RETURNING id
    `, [videoId, pageId]);
    return rows[0] || null;
}

module.exports = { listByVideoId, findByIdAndVideoId, appendPage, isLegacyImage, deleteByIdAndVideoId };
