const pool =
    require('../config/database');


async function getSummary(
    userId
) {

    const query = `
        WITH bounds AS (

            SELECT

                (
                    CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Fortaleza'
                )::date
                    AS today,

                (
                    date_trunc(
                        'week',
                        CURRENT_TIMESTAMP
                            AT TIME ZONE
                            'America/Fortaleza'
                    )
                    AT TIME ZONE
                    'America/Fortaleza'
                )
                    AS current_week_start,

                (
                    (
                        date_trunc(
                            'week',
                            CURRENT_TIMESTAMP
                                AT TIME ZONE
                                'America/Fortaleza'
                        )
                        -
                        INTERVAL '7 days'
                    )
                    AT TIME ZONE
                    'America/Fortaleza'
                )
                    AS previous_week_start

        )

        SELECT

            (
                SELECT
                    COUNT(*)::integer

                FROM video_progress vp,
                     bounds b

                WHERE
                    vp.user_id = $1
                    AND vp.completed_at IS NOT NULL

                    AND (
                        vp.completed_at
                            AT TIME ZONE
                            'America/Fortaleza'
                    )::date =
                        b.today
            )
                AS completed_today,


            (
                SELECT
                    COUNT(*)::integer

                FROM video_progress vp,
                     bounds b

                WHERE
                    vp.user_id = $1
                    AND vp.completed_at IS NOT NULL
                    AND vp.completed_at >=
                        b.current_week_start
            )
                AS completed_week,


            (
                SELECT
                    COUNT(*)::integer

                FROM video_progress vp,
                     bounds b

                WHERE
                    vp.user_id = $1
                    AND vp.completed_at IS NOT NULL
                    AND vp.completed_at >=
                        b.previous_week_start
                    AND vp.completed_at <
                        b.current_week_start
            )
                AS completed_previous_week,


            (
                SELECT
                    weekly_study_goal

                FROM users

                WHERE id = $1
            )
                AS weekly_study_goal,


            (
                SELECT
                    COUNT(*)::integer

                FROM videos
            )
                AS total_videos,


            (
                SELECT
                    COUNT(*)::integer

                FROM video_progress

                WHERE
                    user_id = $1
                    AND completed = TRUE
            )
                AS completed_videos
    `;


    const result =
        await pool.query(
            query,
            [
                userId
            ]
        );


    return result.rows[0];
}

async function getWeeklyActivity(
    userId
) {

    const query = `
        WITH days AS (

            SELECT
                generate_series(
                    date_trunc(
                        'week',
                        CURRENT_DATE
                    ),
                    date_trunc(
                        'week',
                        CURRENT_DATE
                    ) + INTERVAL '6 days',
                    INTERVAL '1 day'
                )::date AS day

        )

        SELECT

            days.day,

            COUNT(
                vp.id
            )::integer
                AS completed

        FROM days

        LEFT JOIN video_progress vp

            ON
                vp.user_id = $1

                AND vp.completed_at IS NOT NULL

                AND (
                    vp.completed_at
                        AT TIME ZONE
                        'America/Fortaleza'
                )::date =
                    days.day

        GROUP BY
            days.day

        ORDER BY
            days.day ASC
    `;


    const result =
        await pool.query(
            query,
            [
                userId
            ]
        );


    return result.rows;
}

async function getMonthlyActivity(
    userId,
    year,
    month
) {

    const query = `
        SELECT

            (
                completed_at
                    AT TIME ZONE
                    'America/Fortaleza'
            )::date
                AS day,

            COUNT(*)::integer
                AS completed

        FROM video_progress

        WHERE
            user_id = $1

            AND completed_at IS NOT NULL

            AND EXTRACT(
                YEAR FROM
                completed_at
                    AT TIME ZONE
                    'America/Fortaleza'
            ) = $2

            AND EXTRACT(
                MONTH FROM
                completed_at
                    AT TIME ZONE
                    'America/Fortaleza'
            ) = $3

        GROUP BY
            day

        ORDER BY
            day ASC
    `;


    const result =
        await pool.query(
            query,
            [
                userId,
                year,
                month
            ]
        );


    return result.rows;
}
async function getContinueStudying(
    userId,
    limit = 5
) {

    const query = `
        SELECT

            v.id,

            v.name,

            v.duration_seconds,

            vp.current_time_seconds,

            vp.completed,

            vp.updated_at,

            CASE

                WHEN
                    v.duration_seconds IS NULL
                    OR v.duration_seconds = 0

                THEN 0

                ELSE ROUND(
                    (
                        vp.current_time_seconds::numeric
                        /
                        v.duration_seconds::numeric
                    ) * 100,
                    1
                )

            END AS progress_percent

        FROM video_progress vp

        INNER JOIN videos v
            ON v.id = vp.video_id

        WHERE
            vp.user_id = $1

            AND vp.completed = FALSE

            AND vp.current_time_seconds > 0

        ORDER BY
            vp.updated_at DESC

        LIMIT $2
    `;


    const result =
        await pool.query(
            query,
            [
                userId,
                limit
            ]
        );


    return result.rows;
}

async function getCurrentStreak(
    userId
) {

    const query = `
        WITH local_today AS (

            SELECT
                (
                    CURRENT_TIMESTAMP
                        AT TIME ZONE
                        'America/Fortaleza'
                )::date
                    AS today

        ),


        study_days AS (

            SELECT DISTINCT

                (
                    completed_at
                        AT TIME ZONE
                        'America/Fortaleza'
                )::date
                    AS day

            FROM video_progress

            WHERE
                user_id = $1
                AND completed_at IS NOT NULL

        ),


        anchor AS (

            SELECT

                CASE

                    /*
                     * Já estudou hoje:
                     * sequência termina hoje.
                     */
                    WHEN EXISTS (

                        SELECT 1

                        FROM study_days

                        WHERE
                            day =
                            local_today.today

                    )

                    THEN
                        local_today.today


                    /*
                     * Ainda não estudou hoje,
                     * mas estudou ontem:
                     *
                     * não quebramos a sequência
                     * até o dia de hoje terminar.
                     */
                    WHEN EXISTS (

                        SELECT 1

                        FROM study_days

                        WHERE
                            day =
                            local_today.today - 1

                    )

                    THEN
                        local_today.today - 1


                    ELSE
                        NULL::date

                END
                    AS anchor_day

            FROM local_today

        ),


        ranked_days AS (

            SELECT

                study_days.day,

                anchor.anchor_day,

                ROW_NUMBER()
                    OVER (
                        ORDER BY
                            study_days.day DESC
                    )
                    AS position

            FROM study_days

            CROSS JOIN anchor

            WHERE
                anchor.anchor_day
                    IS NOT NULL

                AND study_days.day <=
                    anchor.anchor_day

        )

        SELECT

            COUNT(*)::integer
                AS streak

        FROM ranked_days

        WHERE

            day =
                anchor_day
                -
                (
                    position - 1
                )::integer
    `;


    const result =
        await pool.query(
            query,
            [
                userId
            ]
        );


    return Number(
        result.rows[0]?.streak ??
        0
    );
}

async function updateWeeklyGoal(
    userId,
    target
) {

    const query = `
        UPDATE users

        SET
            weekly_study_goal = $2

        WHERE
            id = $1

        RETURNING
            weekly_study_goal
    `;


    const result =
        await pool.query(
            query,
            [
                userId,
                target
            ]
        );


    return result.rows[0];
}


module.exports = {

    getSummary,

    getWeeklyActivity,

    getMonthlyActivity,

    getContinueStudying,

    getCurrentStreak,

    updateWeeklyGoal
};