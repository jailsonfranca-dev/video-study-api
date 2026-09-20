const pool = require('../config/database');


async function upsert(
    {
        driveFolderId,
        name,
        parentFolderId
    },
    db = pool
) {

    const query = `
        INSERT INTO folders (
            drive_folder_id,
            name,
            parent_folder_id
        )
        VALUES ($1, $2, $3)

        ON CONFLICT (drive_folder_id)

        DO UPDATE SET
            name = EXCLUDED.name,
            parent_folder_id =
                EXCLUDED.parent_folder_id,
            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            drive_folder_id,
            name,
            parent_folder_id,
            created_at,
            updated_at
    `;


    const values = [
        driveFolderId,
        name,
        parentFolderId
    ];


    const result =
        await db.query(
            query,
            values
        );


    return result.rows[0];
}


async function findByDriveId(
    driveFolderId,
    db = pool
) {

    const query = `
        SELECT *
        FROM folders
        WHERE drive_folder_id = $1
    `;


    const result =
        await db.query(
            query,
            [driveFolderId]
        );


    return result.rows[0];
}

async function findById(
    id,
    db = pool
) {

    const query = `
        SELECT
            id,
            drive_folder_id,
            name,
            parent_folder_id,
            created_at,
            updated_at
        FROM folders
        WHERE id = $1
    `;

    const result =
        await db.query(
            query,
            [id]
        );

    return result.rows[0];
}

async function findRootFolders(
    db = pool
) {

    const query = `
        SELECT
            f.id,
            f.name,
            f.parent_folder_id,

            (
                SELECT COUNT(*)::integer
                FROM folders child
                WHERE child.parent_folder_id = f.id
            ) AS folder_count,

            (
                SELECT COUNT(*)::integer
                FROM videos v
                WHERE v.folder_id = f.id
            ) AS video_count

        FROM folders f

        WHERE f.parent_folder_id IS NULL

        ORDER BY f.name ASC
    `;

    const result =
        await db.query(query);

    return result.rows;
}

async function findChildren(
    parentFolderId,
    db = pool
) {

    const query = `
        SELECT
            f.id,
            f.name,
            f.parent_folder_id,

            (
                SELECT COUNT(*)::integer
                FROM folders child
                WHERE child.parent_folder_id = f.id
            ) AS folder_count,

            (
                SELECT COUNT(*)::integer
                FROM videos v
                WHERE v.folder_id = f.id
            ) AS video_count

        FROM folders f

        WHERE f.parent_folder_id = $1

        ORDER BY f.name ASC
    `;

    const result =
        await db.query(
            query,
            [parentFolderId]
        );

    return result.rows;
}
module.exports = {
    upsert,
    findByDriveId,
    findById,
    findRootFolders,
    findChildren
};