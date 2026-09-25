const path =
    require('node:path');

const {
    stat
} =
    require('node:fs/promises');


const videoRepository =
    require(
        '../repositories/videoRepository'
    );


const googleDriveService =
    require(
        './googleDriveService'
    );


const {
    extractAudio
} =
    require(
        './audioExtractionService'
    );


const {
    createTempDirectory,
    removeTempDirectory
} =
    require(
        './tempMediaService'
    );


const AppError =
    require(
        '../errors/AppError'
    );


async function prepareVideoAudio(
    userId,
    videoId
) {

    const video =
        await videoRepository
            .findById(
                videoId
            );


    if (!video) {

        throw new AppError(
            'Vídeo não encontrado.',
            404
        );

    }


    if (
        !video.drive_file_id
    ) {

        throw new AppError(
            'Vídeo não possui ID do Google Drive.',
            400
        );

    }


    const tempDirectory =
        await createTempDirectory();


    /*
     * Mantemos a extensão original,
     * caso exista.
     */
    const originalExtension =
        path.extname(
            video.name
        ) || '.mp4';


    const videoPath =
        path.join(
            tempDirectory,
            `source${originalExtension}`
        );


    const audioPath =
        path.join(
            tempDirectory,
            'audio.mp3'
        );


    try {

        console.log(
            'Baixando vídeo do Google Drive...'
        );


        const downloadedVideo =
            await googleDriveService
                .downloadFileToPath(
                    userId,
                    video.drive_file_id,
                    videoPath
                );


        console.log(
            'Vídeo baixado.'
        );


        console.log(
            'Extraindo áudio...'
        );


        await extractAudio(
            videoPath,
            audioPath
        );


        console.log(
            'Áudio extraído.'
        );


        const videoStats =
            await stat(
                videoPath
            );


        const audioStats =
            await stat(
                audioPath
            );


        return {

            videoId:
                String(
                    video.id
                ),

            driveFileId:
            video.drive_file_id,

            originalName:
            video.name,

            tempDirectory,

            videoPath,

            audioPath,

            videoSizeBytes:
            videoStats.size,

            audioSizeBytes:
            audioStats.size
        };


    } catch (error) {

        /*
         * Se algo falhar durante
         * download/extração,
         * não deixamos lixo temporário.
         */
        await removeTempDirectory(
            tempDirectory
        );


        throw error;

    }
}


async function cleanupPreparedMedia(
    preparedMedia
) {

    if (
        !preparedMedia
            ?.tempDirectory
    ) {

        return;

    }


    await removeTempDirectory(
        preparedMedia.tempDirectory
    );
}


module.exports = {

    prepareVideoAudio,

    cleanupPreparedMedia
};