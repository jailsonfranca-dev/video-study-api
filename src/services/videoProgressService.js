const videoRepository =
    require('../repositories/videoRepository');

const videoProgressRepository =
    require('../repositories/videoProgressRepository');

const AppError =
    require('../errors/AppError');

const AUTO_COMPLETE_PERCENTAGE = 90;

async function getExistingVideo(videoId) {

    const video =
        await videoRepository
            .findById(videoId);

    if (!video) {

        throw new AppError(
            'Vídeo não encontrado.',
            404
        );

    }

    return video;
}

async function getProgress(
    userId,
    videoId
) {

    const video =
        await getExistingVideo(videoId);


    const progress =
        await videoProgressRepository
            .findByUserAndVideo(
                userId,
                videoId
            );


    if (!progress) {

        return {

            videoId:
                String(video.id),

            currentTimeSeconds:
                0,

            percentage:
                0,

            completed:
                false,

            lastWatchedAt:
                null
        };
    }


    return {

        videoId:
            String(progress.video_id),

        currentTimeSeconds:
        progress.current_time_seconds,

        percentage:
            Number(progress.percentage),

        completed:
        progress.completed,

        lastWatchedAt:
        progress.last_watched_at
    };
}

async function updateProgress(
    userId,
    videoId,
    currentTimeSeconds
) {

    const video =
        await getExistingVideo(videoId);


    const durationSeconds =
        video.duration_seconds;


    let finalCurrentTime =
        currentTimeSeconds;


    /*
     * Se temos duração conhecida,
     * não permitimos salvar posição
     * além do final do vídeo.
     */
    if (
        durationSeconds !== null &&
        durationSeconds !== undefined
    ) {

        finalCurrentTime =
            Math.min(
                currentTimeSeconds,
                Number(durationSeconds)
            );

    }


    let percentage = 0;


    if (
        durationSeconds &&
        Number(durationSeconds) > 0
    ) {

        percentage =
            (
                finalCurrentTime /
                Number(durationSeconds)
            ) * 100;


        percentage =
            Math.min(
                percentage,
                100
            );

    }


    /*
     * Consideraremos automaticamente
     * concluído ao chegar a 90%.
     */
    const autoCompleted =
        percentage >= AUTO_COMPLETE_PERCENTAGE;


    const previousProgress =
        await videoProgressRepository
            .findByUserAndVideo(
                userId,
                videoId
            );


    /*
     * Se já marcou concluído anteriormente,
     * voltar no vídeo não desfaz a conclusão.
     */
    const completed =
        previousProgress?.completed === true ||
        autoCompleted;


    const progress =
        await videoProgressRepository.upsert({

            userId,

            videoId,

            currentTimeSeconds:
            finalCurrentTime,

            percentage:
                percentage.toFixed(2),

            completed
        });


    return {

        videoId:
            String(progress.video_id),

        currentTimeSeconds:
        progress.current_time_seconds,

        percentage:
            Number(progress.percentage),

        completed:
        progress.completed,

        lastWatchedAt:
        progress.last_watched_at

    };
}

async function markAsCompleted(
    userId,
    videoId
) {

    await getExistingVideo(videoId);


    const progress =
        await videoProgressRepository
            .updateCompleted(
                userId,
                videoId,
                true
            );


    return {

        videoId:
            String(progress.video_id),

        currentTimeSeconds:
        progress.current_time_seconds,

        percentage:
            Number(progress.percentage),

        completed:
        progress.completed,

        lastWatchedAt:
        progress.last_watched_at

    };
}

async function markAsIncomplete(
    userId,
    videoId
) {

    await getExistingVideo(videoId);


    const progress =
        await videoProgressRepository
            .updateCompleted(
                userId,
                videoId,
                false
            );


    return {

        videoId:
            String(progress.video_id),

        currentTimeSeconds:
        progress.current_time_seconds,

        percentage:
            Number(progress.percentage),

        completed:
        progress.completed,

        lastWatchedAt:
        progress.last_watched_at

    };
}

module.exports = {
    getProgress,
    updateProgress,
    markAsCompleted,
    markAsIncomplete
};