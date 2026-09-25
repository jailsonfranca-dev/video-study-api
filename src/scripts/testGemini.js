require('dotenv')
    .config();


const geminiService =
    require(
        '../services/geminiService'
    );


async function main() {

    try {

        console.log(
            'Testando conexão com Gemini...'
        );


        const result =
            await geminiService
                .testConnection();


        console.log(
            'Gemini conectado com sucesso.'
        );


        console.log(
            'Modelo:',
            result.model
        );


        console.log(
            'Resposta:',
            result.message
        );


        /*
         * NÃO usar process.exit(0).
         *
         * Deixamos o Node finalizar
         * naturalmente depois que seus
         * handles assíncronos forem fechados.
         */
        process.exitCode = 0;


    } catch (error) {

        console.error(
            'Erro ao conectar com Gemini:'
        );


        console.error(
            error?.message ??
            error
        );


        /*
         * Também não usamos
         * process.exit(1).
         */
        process.exitCode = 1;

    }

}


main();