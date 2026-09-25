require('dotenv')
    .config();


const {
    generateVideoMindMap
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
            'Gerando mapa mental...'
        );


        console.log(
            'Video ID:',
            videoId
        );


        const result =
            await generateVideoMindMap(
                videoId
            );


        console.log(
            '\nMapa mental gerado com sucesso.'
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
            JSON.stringify(
                result.mindMap,
                null,
                2
            )
        );


        console.log(
            '\n--------------------------------'
        );


        process.exitCode =
            0;


    } catch (error) {

        console.error(
            '\nErro ao gerar mapa mental:'
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