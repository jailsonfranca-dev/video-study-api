const pool =
    require(
        '../config/database'
    );


async function startSession({
                                userId,
                                videoId,
                                startPositionSeconds
                            }) {

    const client =
        await pool.connect();


    try {

        await client.query(
            'BEGIN'
        );


        /*
         * Confirma que o vídeo existe.
         */
        const videoResult =
            await client.query(
                `
                    SELECT id
                    FROM videos
                    WHERE id = $1
                `,
                [
                    videoId
                ]
            );


        if (
            videoResult.rowCount === 0
        ) {

            await client.query(
                'ROLLBACK'
            );

            return null;

        }


        /*
         * Fecha qualquer sessão que tenha
         * ficado aberta anteriormente.
         *
         * Isso evita sessões órfãs em caso
         * de refresh, fechamento inesperado
         * da aba etc.
         */
        await client.query(
            `
                UPDATE study_sessions

                SET
                    ended_at =
                        CURRENT_TIMESTAMP,

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE
                    user_id = $1
                    AND ended_at IS NULL
            `,
            [
                userId
            ]
        );


        const result =
            await client.query(
                `
                    INSERT INTO study_sessions (
                        user_id,
                        video_id,
                        start_position_seconds
                    )

                    VALUES (
                        $1,
                        $2,
                        $3
                    )

                    RETURNING
                        id,
                        user_id,
                        video_id,
                        started_at,
                        ended_at,
                        watched_seconds,
                        start_position_seconds,
                        end_position_seconds,
                        created_at,
                        updated_at
                `,
                [
                    userId,
                    videoId,
                    startPositionSeconds
                ]
            );


        await client.query(
            'COMMIT'
        );


        return result.rows[0];


    } catch (error) {

        await client.query(
            'ROLLBACK'
        );


        throw error;


    } finally {

        client.release();

    }

}


async function addStudyTime({
                                userId,
                                sessionId,
                                watchedSeconds,
                                currentPositionSeconds
                            }) {

    const client =
        await pool.connect();


    try {

        await client.query(
            'BEGIN'
        );


        /*
         * Bloqueia a sessão enquanto
         * fazemos a atualização.
         */
        const sessionResult =
            await client.query(
                `
                    SELECT
                        id,
                        video_id

                    FROM study_sessions

                    WHERE
                        id = $1
                        AND user_id = $2
                        AND ended_at IS NULL

                    FOR UPDATE
                `,
                [
                    sessionId,
                    userId
                ]
            );


        if (
            sessionResult.rowCount === 0
        ) {

            await client.query(
                'ROLLBACK'
            );

            return null;

        }


        const session =
            sessionResult.rows[0];


        /*
         * Atualiza a sessão individual.
         */
        const updatedSessionResult =
            await client.query(
                `
                    UPDATE study_sessions

                    SET
                        watched_seconds =
                            watched_seconds + $3,

                        end_position_seconds =
                            $4,

                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE
                        id = $1
                        AND user_id = $2

                    RETURNING
                        id,
                        user_id,
                        video_id,
                        started_at,
                        ended_at,
                        watched_seconds,
                        start_position_seconds,
                        end_position_seconds,
                        created_at,
                        updated_at
                `,
                [
                    sessionId,
                    userId,
                    watchedSeconds,
                    currentPositionSeconds
                ]
            );


        /*
         * Mantém também o agregado diário
         * utilizado pelo Dashboard.
         */
        await client.query(
            `
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
            `,
            [
                userId,
                session.video_id,
                watchedSeconds
            ]
        );


        await client.query(
            'COMMIT'
        );


        return updatedSessionResult.rows[0];


    } catch (error) {

        await client.query(
            'ROLLBACK'
        );


        throw error;


    } finally {

        client.release();

    }

}


async function endSession({
                              userId,
                              sessionId,
                              endPositionSeconds
                          }) {

    const result =
        await pool.query(
            `
                UPDATE study_sessions

                SET
                    ended_at =
                        COALESCE(
                            ended_at,
                            CURRENT_TIMESTAMP
                        ),

                    end_position_seconds =
                        COALESCE(
                            $3,
                            end_position_seconds
                        ),

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE
                    id = $1
                    AND user_id = $2

                RETURNING
                    id,
                    user_id,
                    video_id,
                    started_at,
                    ended_at,
                    watched_seconds,
                    start_position_seconds,
                    end_position_seconds,
                    created_at,
                    updated_at
            `,
            [
                sessionId,
                userId,
                endPositionSeconds
            ]
        );


    return result.rows[0] ??
        null;

}


module.exports = {
    startSession,
    addStudyTime,
    endSession
};