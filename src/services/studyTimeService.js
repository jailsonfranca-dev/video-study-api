const AppError =
    require(
        '../errors/AppError'
    );


const studyTimeRepository =
    require(
        '../repositories/studyTimeRepository'
    );


async function registerStudyTime(
    {
        userId,
        videoId,
        watchedSeconds
    }
) {

    const numericVideoId =
        Number(
            videoId
        );


    const numericWatchedSeconds =
        Number(
            watchedSeconds
        );


    if (
        !Number.isInteger(
            numericVideoId
        )
        ||
        numericVideoId <= 0
    ) {

        throw new AppError(
            'Vídeo inválido.',
            400
        );

    }


    if (
        !Number.isInteger(
            numericWatchedSeconds
        )
        ||
        numericWatchedSeconds <= 0
        ||
        numericWatchedSeconds > 60
    ) {

        throw new AppError(
            'O tempo assistido deve ser um número inteiro entre 1 e 60 segundos.',
            400
        );

    }


    const studyTime =
        await studyTimeRepository
            .addStudyTime({

                userId,

                videoId:
                numericVideoId,

                watchedSeconds:
                numericWatchedSeconds

            });


    return {

        videoId:
            String(
                studyTime.video_id
            ),

        studyDate:
        studyTime.study_date,

        addedSeconds:
        numericWatchedSeconds,

        watchedSeconds:
            Number(
                studyTime.watched_seconds
            )

    };
}


module.exports = {
    registerStudyTime
};