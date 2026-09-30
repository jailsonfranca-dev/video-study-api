const studySessionService =
    require(
        '../services/studySessionService'
    );


async function start(
    req,
    res,
    next
) {

    try {

        const session =
            await studySessionService
                .startSession({

                    userId:
                    req.user.id,

                    videoId:
                    req.params.videoId,

                    startPositionSeconds:
                    req.body
                        .startPositionSeconds

                });


        return res
            .status(201)
            .json({

                message:
                    'Sessão de estudo iniciada.',

                session

            });


    } catch (error) {

        next(
            error
        );

    }

}


async function addTime(
    req,
    res,
    next
) {

    try {

        const session =
            await studySessionService
                .addStudyTime({

                    userId:
                    req.user.id,

                    sessionId:
                    req.params.sessionId,

                    watchedSeconds:
                    req.body
                        .watchedSeconds,

                    currentPositionSeconds:
                    req.body
                        .currentPositionSeconds

                });


        return res
            .status(200)
            .json({

                message:
                    'Tempo da sessão atualizado.',

                session

            });


    } catch (error) {

        next(
            error
        );

    }

}


async function end(
    req,
    res,
    next
) {

    try {

        const session =
            await studySessionService
                .endSession({

                    userId:
                    req.user.id,

                    sessionId:
                    req.params.sessionId,

                    endPositionSeconds:
                    req.body
                        .endPositionSeconds

                });


        return res
            .status(200)
            .json({

                message:
                    'Sessão de estudo encerrada.',

                session

            });


    } catch (error) {

        next(
            error
        );

    }

}


module.exports = {
    start,
    addTime,
    end
};