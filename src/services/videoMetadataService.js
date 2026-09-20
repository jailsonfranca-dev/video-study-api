const videoRepository =
    require('../repositories/videoRepository');

const AppError =
    require('../errors/AppError');


async function updateDuration(
    videoId,
    durationSeconds
) {

    const video =
        await videoRepository
            .findById(videoId);

    if (!video) {

        throw new AppError(
            'Vídeo não encontrado.',
            404
        );

    }


    const updatedVideo =
        await videoRepository
            .updateDuration(
                videoId,
                durationSeconds
            );


    return {
        id:
            String(updatedVideo.id),

        name:
        updatedVideo.name,

        durationSeconds:
        updatedVideo.duration_seconds,

        updatedAt:
        updatedVideo.updated_at
    };
}


module.exports = {
    updateDuration
};