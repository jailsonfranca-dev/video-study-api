const studyTimeService =
    require(
        '../services/studyTimeService'
    );


async function register(
    req,
    res,
    next
) {

    try {

        const result =
            await studyTimeService
                .registerStudyTime({

                    userId:
                    req.user.id,

                    videoId:
                    req.params.videoId,

                    watchedSeconds:
                    req.body.watchedSeconds

                });


        return res
            .status(200)
            .json({

                message:
                    'Tempo de estudo registrado.',

                studyTime:
                result

            });


    } catch (error) {

        next(
            error
        );

    }

}


module.exports = {
    register
};