const pool =
    require(
        '../config/database'
    );


async function addStudyTime(
    {
        userId,
        videoId,
        watchedSeconds
    },
    db = pool
) {

    const query = `
        INSERT INTO study_time_daily (
            user_id,
            video_id,
            study_date,
            watched_seconds
        )

        VALUES (
            $1,
            $2,
            (
                CURRENT_TIMESTAMP
                    AT TIME ZONE
                    'America/Fortaleza'
            )::date,
            $3
        )

        ON CONFLICT (
            user_id,
            video_id,
            study_date
        )

        DO UPDATE SET

            watched_seconds =
                study_time_daily.watched_seconds
                +
                EXCLUDED.watched_seconds,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING

            id,

            user_id,

            video_id,

            study_date,

            watched_seconds,

            created_at,

            updated_at
    `;


    const result =
        await db.query(
            query,
            [
                userId,
                videoId,
                watchedSeconds
            ]
        );


    return result.rows[0];
}


module.exports = {
    addStudyTime
};