const videoStreamService =
    require('../services/videoStreamService');


async function stream(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        const range =
            req.headers.range;


        const result =
            await videoStreamService
                .createVideoStream(
                    req.user.id,
                    id,
                    range
                );


        /*
         * IMPORTANTE:
         *
         * Não inventamos 206.
         *
         * Se o Google retornar 206,
         * devolvemos 206.
         *
         * Se retornar 200,
         * devolvemos 200.
         */
        res.status(
            result.status
        );


        res.setHeader(
            'Content-Type',
            result.contentType
        );


        res.setHeader(
            'Accept-Ranges',
            result.acceptRanges
        );


        if (result.contentLength) {

            res.setHeader(
                'Content-Length',
                result.contentLength
            );

        }


        if (result.contentRange) {

            res.setHeader(
                'Content-Range',
                result.contentRange
            );

        }


        res.setHeader(
            'Cache-Control',
            'private, no-cache'
        );


        /*
         * Se o Google interromper o stream
         * depois que já mandamos headers,
         * não podemos enviar outro JSON.
         */
        result.stream.on(
            'error',
            error => {

                console.error(
                    'Erro durante streaming:',
                    error
                );


                if (!res.headersSent) {

                    next(error);

                } else {

                    res.destroy(error);

                }

            }
        );


        /*
         * Se o cliente abandonar o vídeo,
         * interrompemos também o stream
         * vindo do Google.
         */
        req.on(
            'aborted',
            () => {

                result.stream.destroy();

            }
        );


        result.stream.pipe(res);


    } catch (error) {

        next(error);

    }
}


module.exports = {
    stream
};