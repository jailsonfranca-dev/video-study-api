const AppError =
    require(
        '../errors/AppError'
    );


const studySessionRepository =
    require(
        '../repositories/studySessionRepository'
    );


function parsePositiveId(
    value,
    fieldName
) {

    const numericValue =
        Number(
            value
        );


    if (
        !Number.isInteger(
            numericValue
        )
        ||
        numericValue <= 0
    ) {

        throw new AppError(
            `${fieldName} inválido.`,
            400
        );

    }


    return numericValue;

}


function parsePosition(
    value
) {

    const numericValue =
        Number(
            value ?? 0
        );


    if (
        !Number.isFinite(
            numericValue
        )
        ||
        numericValue < 0
    ) {

        throw new AppError(
            'A posição do vídeo é inválida.',
            400
        );

    }


    return Math.floor(
        numericValue
    );

}


async function startSession({
                                userId,
                                videoId,
                                startPositionSeconds
                            }) {

    const numericVideoId =
        parsePositiveId(
            videoId,
            'Vídeo'
        );


    const numericPosition =
        parsePosition(
            startPositionSeconds
        );


    const session =
        await studySessionRepository
            .startSession({

                userId,

                videoId:
                numericVideoId,

                startPositionSeconds:
                numericPosition

            });


    if (!session) {

        throw new AppError(
            'Vídeo não encontrado.',
            404
        );

    }


    return {

        id:
            String(
                session.id
            ),

        videoId:
            String(
                session.video_id
            ),

        startedAt:
        session.started_at,

        endedAt:
        session.ended_at,

        watchedSeconds:
            Number(
                session.watched_seconds
            ),

        startPositionSeconds:
            Number(
                session.start_position_seconds ??
                0
            ),

        endPositionSeconds:
            session.end_position_seconds !==
            null

                ? Number(
                    session.end_position_seconds
                )

                : null

    };

}


async function addStudyTime({
                                userId,
                                sessionId,
                                watchedSeconds,
                                currentPositionSeconds
                            }) {

    const numericSessionId =
        parsePositiveId(
            sessionId,
            'Sessão'
        );


    const numericWatchedSeconds =
        Number(
            watchedSeconds
        );


    if (
        !Number.isInteger(
            numericWatchedSeconds
        )
        ||
        numericWatchedSeconds < 1
        ||
        numericWatchedSeconds > 60
    ) {

        throw new AppError(
            'O tempo assistido deve ser um número inteiro entre 1 e 60 segundos.',
            400
        );

    }


    const numericPosition =
        parsePosition(
            currentPositionSeconds
        );


    const session =
        await studySessionRepository
            .addStudyTime({

                userId,

                sessionId:
                numericSessionId,

                watchedSeconds:
                numericWatchedSeconds,

                currentPositionSeconds:
                numericPosition

            });


    if (!session) {

        throw new AppError(
            'Sessão de estudo não encontrada ou já encerrada.',
            404
        );

    }


    return {

        id:
            String(
                session.id
            ),

        videoId:
            String(
                session.video_id
            ),

        watchedSeconds:
            Number(
                session.watched_seconds
            ),

        endPositionSeconds:
            Number(
                session.end_position_seconds ??
                0
            ),

        startedAt:
        session.started_at

    };

}


async function endSession({
                              userId,
                              sessionId,
                              endPositionSeconds
                          }) {

    const numericSessionId =
        parsePositiveId(
            sessionId,
            'Sessão'
        );


    const numericPosition =
        parsePosition(
            endPositionSeconds
        );


    const session =
        await studySessionRepository
            .endSession({

                userId,

                sessionId:
                numericSessionId,

                endPositionSeconds:
                numericPosition

            });


    if (!session) {

        throw new AppError(
            'Sessão de estudo não encontrada.',
            404
        );

    }


    return {

        id:
            String(
                session.id
            ),

        videoId:
            String(
                session.video_id
            ),

        startedAt:
        session.started_at,

        endedAt:
        session.ended_at,

        watchedSeconds:
            Number(
                session.watched_seconds
            ),

        startPositionSeconds:
            Number(
                session.start_position_seconds ??
                0
            ),

        endPositionSeconds:
            Number(
                session.end_position_seconds ??
                0
            )

    };

}


module.exports = {
    startSession,
    addStudyTime,
    endSession
};