const pool = require('../config/database');


async function upsert(
    {
        driveFileId,
        name,
        mimeType,
        durationSeconds,
        sizeBytes,
        folderId
    },
    db = pool
) {

    const query = `
        INSERT INTO videos (
            drive_file_id,
            name,
            mime_type,
            duration_seconds,
            size_bytes,
            folder_id
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )

        ON CONFLICT (drive_file_id)

        DO UPDATE SET
            name =
                EXCLUDED.name,

            mime_type =
                EXCLUDED.mime_type,

            duration_seconds =
                EXCLUDED.duration_seconds,

            size_bytes =
                EXCLUDED.size_bytes,

            folder_id =
                EXCLUDED.folder_id,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            drive_file_id,
            name,
            mime_type,
            duration_seconds,
            size_bytes,
            folder_id,
            created_at,
            updated_at
    `;


    const values = [
        driveFileId,
        name,
        mimeType,
        durationSeconds,
        sizeBytes,
        folderId
    ];


    const result =
        await db.query(
            query,
            values
        );


    return result.rows[0];
}


async function findByDriveId(
    driveFileId,
    db = pool
) {

    const query = `
        SELECT *
        FROM videos
        WHERE drive_file_id = $1
    `;


    const result =
        await db.query(
            query,
            [driveFileId]
        );


    return result.rows[0];
}

async function findById(
    id,
    db = pool
) {

    const query = `
        SELECT
            v.id,
            v.drive_file_id,
            v.name,
            v.mime_type,
            v.duration_seconds,
            v.size_bytes,
            v.folder_id,
            v.created_at,
            v.updated_at,

            f.name AS folder_name

        FROM videos v

        INNER JOIN folders f
            ON f.id = v.folder_id

        WHERE v.id = $1
    `;

    const result =
        await db.query(
            query,
            [id]
        );

    return result.rows[0];
}

async function findByFolderId(
    folderId,
    db = pool
) {

    const query = `
        SELECT
            id,
            name,
            mime_type,
            duration_seconds,
            size_bytes,
            folder_id,
            created_at,
            updated_at

        FROM videos

        WHERE folder_id = $1

        ORDER BY name ASC
    `;

    const result =
        await db.query(
            query,
            [folderId]
        );

    return result.rows;
}

async function findByFolderIdWithProgress(
    folderId,
    userId,
    db = pool
) {

    const query = `
        SELECT
            v.id,
            v.name,
            v.mime_type,
            v.duration_seconds,
            v.size_bytes,
            v.folder_id,
            v.created_at,
            v.updated_at,

            COALESCE(
                vp.current_time_seconds,
                0
            ) AS current_time_seconds,

            COALESCE(
                vp.percentage,
                0
            ) AS percentage,

            COALESCE(
                vp.completed,
                false
            ) AS completed,

            vp.last_watched_at

        FROM videos v

        LEFT JOIN video_progress vp
            ON vp.video_id = v.id
           AND vp.user_id = $2

        WHERE v.folder_id = $1

        ORDER BY v.name ASC
    `;


    const result =
        await db.query(
            query,
            [
                folderId,
                userId
            ]
        );


    return result.rows;
}

async function updateDuration(
    id,
    durationSeconds,
    db = pool
) {

    const query = `
        UPDATE videos

        SET
            duration_seconds = $2,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING
            id,
            name,
            duration_seconds,
            mime_type,
            size_bytes,
            folder_id,
            updated_at
    `;

    const result =
        await db.query(
            query,
            [
                id,
                durationSeconds
            ]
        );

    return result.rows[0];
}

module.exports = {
    upsert,
    findByDriveId,
    findById,
    findByFolderId,
    findByFolderIdWithProgress,
    updateDuration
};