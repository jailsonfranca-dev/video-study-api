require('dotenv')
    .config();


const aiService =
    require(
        '../services/ai/aiService'
    );


async function main() {

    try {

        console.log(
            'Testando provedor de IA...'
        );


        console.log(
            'Provider:',
            process.env.AI_PROVIDER
        );


        const result =
            await aiService
                .testConnection();


        console.log(
            '\nIA conectada com sucesso.'
        );


        console.log(
            'Provider:',
            result.provider
        );


        console.log(
            'Modelo:',
            result.model
        );


        console.log(
            'Resposta:',
            result.message
        );


        process.exitCode =
            0;


    } catch (error) {

        console.error(
            '\nErro ao conectar com IA:'
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