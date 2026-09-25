require('dotenv')
    .config();


const {
    transcribeVideo
} =
    require(
        '../services/videoTranscriptionService'
    );


async function main() {

    try {

        const userId =
            process.argv[2];


        const videoId =
            process.argv[3];


        if (
            !userId ||
            !videoId
        ) {

            throw new Error(
                'Informe userId e videoId.'
            );

        }


        console.log(
            'Iniciando transcrição...'
        );


        console.log(
            'User ID:',
            userId
        );


        console.log(
            'Video ID:',
            videoId
        );


        const result =
            await transcribeVideo(
                userId,
                videoId
            );


        console.log(
            '\nTranscrição concluída com sucesso.'
        );


        console.log(
            '\nModelo:',
            result.transcriptionModel
        );


        console.log(
            'Idioma:',
            result.language
        );


        console.log(
            '\nPrévia da transcrição:\n'
        );


        console.log(
            result.transcript.substring(
                0,
                1000
            )
        );


        if (
            result.transcript.length >
            1000
        ) {

            console.log(
                '\n[...]'
            );

        }


        process.exitCode =
            0;


    } catch (error) {

        console.error(
            '\nErro ao transcrever vídeo:'
        );


        console.error(
            error?.message ??
            error
        );


        process.exitCode =
            1;

    }

}


main();