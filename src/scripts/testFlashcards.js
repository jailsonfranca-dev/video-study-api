require('dotenv')
    .config();


const {
    generateVideoFlashcards
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
            'Gerando flashcards...'
        );


        console.log(
            'Video ID:',
            videoId
        );


        const result =
            await generateVideoFlashcards(
                videoId
            );


        console.log(
            '\nFlashcards gerados com sucesso.'
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
            '\n--------------------------------'
        );


        for (
            const flashcard
            of result.flashcards
            ) {

            console.log(
                `\nFLASHCARD ${flashcard.position}`
            );


            console.log(
                'Pergunta:',
                flashcard.question
            );


            console.log(
                'Resposta:',
                flashcard.answer
            );

        }


        console.log(
            '\n--------------------------------'
        );


        console.log(
            '\nTotal:',
            result.flashcards.length
        );


        process.exitCode =
            0;


    } catch (error) {

        console.error(
            '\nErro ao gerar flashcards:'
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