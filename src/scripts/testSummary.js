require('dotenv')
    .config();


const {
    generateVideoSummary
} =
    require(
        '../services/studyMaterialService'
    );


async function main() {

    try {

        const videoId =
            process.argv[2];


        if (!videoId) {

            throw new Error(
                'Informe o videoId.'
            );

        }


        console.log(
            'Gerando resumo...'
        );


        console.log(
            'Video ID:',
            videoId
        );


        const result =
            await generateVideoSummary(
                videoId
            );


        console.log(
            '\nResumo gerado com sucesso.'
        );


        console.log(
            '\nModelo:',
            result.generationModel
        );


        console.log(
            'Status:',
            result.status
        );


        console.log(
            '\n--------------------------------\n'
        );


        console.log(
            result.summary
        );


        console.log(
            '\n--------------------------------'
        );


        process.exitCode =
            0;


    } catch (error) {

        console.error(
            '\nErro ao gerar resumo:'
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