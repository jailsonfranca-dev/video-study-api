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

            f.id
                AS folder_id,

            f.name
                AS folder_name,

            vp.current_time_seconds,

            vp.percentage
                AS progress_percent,

            vp.last_watched_at

        FROM video_progress vp

        INNER JOIN videos v
            ON v.id = vp.video_id

        LEFT JOIN folders f
            ON f.id = v.folder_id

        WHERE
            vp.user_id = $1

            AND vp.completed = FALSE

            AND vp.current_time_seconds > 0

        ORDER BY
            vp.last_watched_at DESC

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

async function getRecentActivity(
    userId,
    limit = 8
) {

    const query = `
        SELECT

            v.id
                AS video_id,

            v.name
                AS video_name,

            v.duration_seconds,

            f.id
                AS folder_id,

            f.name
                AS folder_name,

            vp.current_time_seconds,

            vp.percentage,

            vp.completed,

            vp.last_watched_at,

            vp.completed_at,

            CASE

                WHEN
                    vp.completed = TRUE
                    AND vp.completed_at IS NOT NULL

                THEN
                    vp.completed_at

                ELSE
                    vp.last_watched_at

            END
                AS activity_at

        FROM video_progress vp

        INNER JOIN videos v
            ON v.id = vp.video_id

        LEFT JOIN folders f
            ON f.id = v.folder_id

        WHERE
            vp.user_id = $1

            AND (
                vp.current_time_seconds > 0
                OR vp.completed = TRUE
            )

        ORDER BY
            activity_at DESC NULLS LAST

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

async function getStudyTimeSummary(
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

                DATE_TRUNC(
                    'week',
                    CURRENT_TIMESTAMP
                    AT TIME ZONE
                    'America/Fortaleza'
                )::date
                    AS week_start

        ),

        summary AS (

            SELECT

                COALESCE(
                    SUM(
                        CASE
                            WHEN
                                std.study_date =
                                bounds.today
                            THEN
                                std.watched_seconds
                            ELSE
                                0
                        END
                    ),
                    0
                ) AS today_seconds,


                COALESCE(
                    SUM(
                        CASE
                            WHEN
                                std.study_date >=
                                bounds.week_start

                                AND

                                std.study_date <=
                                bounds.today
                            THEN
                                std.watched_seconds
                            ELSE
                                0
                        END
                    ),
                    0
                ) AS week_seconds,


                COALESCE(
                    SUM(
                        std.watched_seconds
                    ),
                    0
                ) AS total_seconds,


                (
                    bounds.today -
                    bounds.week_start
                ) + 1
                    AS days_elapsed

            FROM bounds

            LEFT JOIN study_time_daily std
                ON std.user_id = $1

            GROUP BY
                bounds.today,
                bounds.week_start

        ),

        best_day AS (

            SELECT

                std.study_date,

                SUM(
                    std.watched_seconds
                ) AS seconds

            FROM study_time_daily std

            CROSS JOIN bounds

            WHERE
                std.user_id = $1

                AND
                std.study_date >=
                bounds.week_start

                AND
                std.study_date <=
                bounds.today

            GROUP BY
                std.study_date

            ORDER BY
                seconds DESC,
                std.study_date DESC

            LIMIT 1

        )

        SELECT

            summary.today_seconds,

            summary.week_seconds,

            summary.total_seconds,

            summary.days_elapsed,

            COALESCE(
                u.weekly_study_minutes,
                600
            ) AS weekly_study_minutes,

            TO_CHAR(
                best_day.study_date,
                'YYYY-MM-DD'
            ) AS best_day_date,

            COALESCE(
                best_day.seconds,
                0
            ) AS best_day_seconds

        FROM summary

        LEFT JOIN best_day
            ON TRUE

        LEFT JOIN users u
            ON u.id = $1
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

async function getWeeklyStudyTime(
    userId
) {

    const query = `
        WITH bounds AS (

            SELECT

                DATE_TRUNC(
                    'week',
                    CURRENT_TIMESTAMP
                    AT TIME ZONE
                    'America/Fortaleza'
                )::date
                    AS week_start

        ),

        days AS (

            SELECT

                generate_series(
                    bounds.week_start,
                    bounds.week_start + 6,
                    INTERVAL '1 day'
                )::date
                    AS study_date

            FROM bounds

        ),

        totals AS (

            SELECT

                study_date,

                SUM(
                    watched_seconds
                ) AS seconds

            FROM study_time_daily

            WHERE
                user_id = $1

            GROUP BY
                study_date

        )

        SELECT

            days.study_date,

            EXTRACT(
                ISODOW
                FROM days.study_date
            )::integer
                AS day_of_week,

            COALESCE(
                totals.seconds,
                0
            ) AS seconds

        FROM days

        LEFT JOIN totals
            ON totals.study_date =
               days.study_date

        ORDER BY
            days.study_date
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

async function updateWeeklyStudyTimeGoal(
    userId,
    targetMinutes
) {

    const query = `
        UPDATE users

        SET
            weekly_study_minutes = $2

        WHERE
            id = $1

        RETURNING
            weekly_study_minutes
    `;


    const result =
        await pool.query(
            query,
            [
                userId,
                targetMinutes
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

    updateWeeklyGoal,

    getRecentActivity,

    getStudyTimeSummary,

    getWeeklyStudyTime,

    updateWeeklyStudyTimeGoal
};