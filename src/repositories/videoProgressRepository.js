const pool =
    require('../config/database');


async function findByUserAndVideo(
    userId,
    videoId,
    db = pool
) {

    const query = `
        SELECT
            id,
            user_id,
            video_id,
            current_time_seconds,
            percentage,
            completed,
            completed_at,
            last_watched_at,
            created_at,
            updated_at

        FROM video_progress

        WHERE user_id = $1
          AND video_id = $2
    `;


    const result =
        await db.query(
            query,
            [
                userId,
                videoId
            ]
        );


    return result.rows[0];
}


async function upsert(
    {
        userId,
        videoId,
        currentTimeSeconds,
        percentage,
        completed
    },
    db = pool
) {

    const query = `
        INSERT INTO video_progress (
            user_id,
            video_id,
            current_time_seconds,
            percentage,
            completed,
            completed_at,
            last_watched_at
        )

        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,

            CASE
                WHEN $5 = TRUE
                THEN CURRENT_TIMESTAMP
                ELSE NULL
            END,

            CURRENT_TIMESTAMP
        )

        ON CONFLICT (user_id, video_id)

        DO UPDATE SET

            current_time_seconds =
                EXCLUDED.current_time_seconds,

            percentage =
                EXCLUDED.percentage,

            completed =
                EXCLUDED.completed,

            completed_at =
                CASE

                    WHEN
                        video_progress.completed_at IS NULL
                        AND EXCLUDED.completed = TRUE

                    THEN CURRENT_TIMESTAMP

                    ELSE
                        video_progress.completed_at

                END,

            last_watched_at =
                CURRENT_TIMESTAMP,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            user_id,
            video_id,
            current_time_seconds,
            percentage,
            completed,
            completed_at,
            last_watched_at,
            created_at,
            updated_at
    `;


    const values = [
        userId,
        videoId,
        currentTimeSeconds,
        percentage,
        completed
    ];


    const result =
        await db.query(
            query,
            values
        );


    return result.rows[0];
}


async function updateCompleted(
    userId,
    videoId,
    completed,
    db = pool
) {

    const query = `
        INSERT INTO video_progress (
            user_id,
            video_id,
            completed,
            completed_at,
            last_watched_at
        )

        VALUES (
            $1,
            $2,
            $3,

            CASE
                WHEN $3 = TRUE
                THEN CURRENT_TIMESTAMP
                ELSE NULL
            END,

            CURRENT_TIMESTAMP
        )

        ON CONFLICT (user_id, video_id)

        DO UPDATE SET

            completed =
                EXCLUDED.completed,

            completed_at =
                CASE

                    WHEN
                        video_progress.completed_at IS NULL
                        AND EXCLUDED.completed = TRUE

                    THEN CURRENT_TIMESTAMP

                    ELSE
                        video_progress.completed_at

                END,

            last_watched_at =
                CURRENT_TIMESTAMP,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            user_id,
            video_id,
            current_time_seconds,
            percentage,
            completed,
            completed_at,
            last_watched_at,
            created_at,
            updated_at
    `;


    const result =
        await db.query(
            query,
            [
                userId,
                videoId,
                completed
            ]
        );


    return result.rows[0];
}


module.exports = {

    findByUserAndVideo,

    upsert,

    updateCompleted
};