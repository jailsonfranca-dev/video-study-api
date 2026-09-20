const videoRepository =
    require('../repositories/videoRepository');

const googleDriveService =
    require('./googleDriveService');

const AppError =
    require('../errors/AppError');

function getHeader(headers, name) {

    if (!headers) {
        return null;
    }

    if (typeof headers.get === 'function') {
        return headers.get(name);
    }

    return (
        headers[name] ||
        headers[name.toLowerCase()] ||
        null
    );
}

async function createVideoStream(
    userId,
    videoId,
    range
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


    if (!video.drive_file_id) {

        throw new AppError(
            'Vídeo não possui arquivo associado no Google Drive.',
            404
        );

    }


    if (
        !video.mime_type ||
        !video.mime_type.startsWith('video/')
    ) {

        throw new AppError(
            'O arquivo solicitado não é um vídeo.',
            400
        );

    }


    const drive =
        await googleDriveService
            .createAuthenticatedDriveClient(
                userId
            );


    try {

        const requestOptions = {
            responseType: 'stream'
        };


        /*
         * Se o navegador pediu um intervalo,
         * encaminhamos exatamente esse Range
         * para o Google Drive.
         */
        if (range) {

            requestOptions.headers = {
                Range: range
            };

        }


        const googleResponse =
            await drive.files.get(
                {
                    fileId:
                    video.drive_file_id,

                    alt:
                        'media',

                    supportsAllDrives:
                        true
                },

                requestOptions
            );


        return {

            stream:
            googleResponse.data,

            status:
            googleResponse.status,

            contentType:
                getHeader(
                    googleResponse.headers,
                    'content-type'
                ) ||
                video.mime_type ||
                'application/octet-stream',

            contentLength:
                getHeader(
                    googleResponse.headers,
                    'content-length'
                ),

            contentRange:
                getHeader(
                    googleResponse.headers,
                    'content-range'
                ),

            acceptRanges:
                getHeader(
                    googleResponse.headers,
                    'accept-ranges'
                ) || 'bytes',

            video
        };


    } catch (error) {

        const status =
            error.response?.status ||
            error.code;


        if (status === 404) {

            throw new AppError(
                'Arquivo de vídeo não encontrado no Google Drive.',
                404
            );

        }


        if (status === 403) {

            throw new AppError(
                'A conta Google conectada não possui permissão para reproduzir este vídeo.',
                403
            );

        }


        if (status === 416) {

            throw new AppError(
                'Intervalo de bytes inválido.',
                416
            );

        }


        throw error;
    }
}
module.exports = {
    createVideoStream
};