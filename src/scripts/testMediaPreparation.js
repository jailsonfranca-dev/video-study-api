require('dotenv')
    .config();


const {
    prepareVideoAudio,
    cleanupPreparedMedia
} =
    require(
        '../services/mediaPreparationService'
    );


async function main() {

    let preparedMedia =
        null;


    try {

        const userId =
            process.argv[2];


        const videoId =
            process.argv[3];


        const keepFiles =
            process.argv.includes(
                '--keep'
            );


        if (
            !userId ||
            !videoId
        ) {

            throw new Error(
                'Informe userId e videoId.'
            );

        }


        console.log(
            'Preparando mídia...'
        );


        console.log(
            'User ID:',
            userId
        );


        console.log(
            'Video ID:',
            videoId
        );


        preparedMedia =
            await prepareVideoAudio(
                userId,
                videoId
            );


        console.log(
            '\nProcessamento concluído.'
        );


        console.log(
            '\nDiretório temporário:',
            preparedMedia.tempDirectory
        );


        console.log(
            'Vídeo:',
            preparedMedia.videoPath
        );


        console.log(
            'Áudio:',
            preparedMedia.audioPath
        );


        console.log(
            '\nTamanho vídeo:',
            (
                preparedMedia
                    .videoSizeBytes /
                1024 /
                1024
            ).toFixed(
                2
            ),
            'MB'
        );


        console.log(
            'Tamanho áudio:',
            (
                preparedMedia
                    .audioSizeBytes /
                1024 /
                1024
            ).toFixed(
                2
            ),
            'MB'
        );


        if (keepFiles) {

            console.log(
                '\nArquivos temporários mantidos para inspeção.'
            );

            console.log(
                'Depois do teste, exclua o diretório temporário manualmente.'
            );

        } else {

            await cleanupPreparedMedia(
                preparedMedia
            );


            console.log(
                '\nArquivos temporários removidos.'
            );

        }


        process.exitCode =
            0;


    } catch (error) {

        console.error(
            '\nErro ao preparar mídia:'
        );


        console.error(
            error?.message ??
            error
        );


        /*
         * Se prepareVideoAudio()
         * conseguiu retornar algo antes
         * de outro erro posterior.
         */
        if (
            preparedMedia
                ?.tempDirectory
        ) {

            await cleanupPreparedMedia(
                preparedMedia
            );

        }


        process.exitCode =
            1;

    }

}


main();