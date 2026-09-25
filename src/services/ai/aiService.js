const groqProvider =
    require(
        './groqProvider'
    );


function getProvider() {

    const provider =
        (
            process.env
                .AI_PROVIDER ||
            'groq'
        )
            .toLowerCase()
            .trim();


    switch (
        provider
        ) {

        case 'groq':

            return {

                name:
                    'groq',

                instance:
                groqProvider
            };


        default:

            throw new Error(
                `AI_PROVIDER não suportado: ${provider}`
            );

    }

}


function getProviderInstance() {

    return getProvider()
        .instance;

}


function getTextModel() {

    return getProviderInstance()
        .getTextModel();

}


async function testConnection() {

    return getProviderInstance()
        .testConnection();

}


async function transcribeAudio(
    audioPath
) {

    return getProviderInstance()
        .transcribeAudio(
            audioPath
        );

}


async function generateSummary(
    transcript
) {

    return getProviderInstance()
        .generateSummary(
            transcript
        );

}


async function generateMindMap(
    transcript
) {

    return getProviderInstance()
        .generateMindMap(
            transcript
        );

}


async function generateFlashcards(
    transcript
) {

    return getProviderInstance()
        .generateFlashcards(
            transcript
        );

}


module.exports = {

    getProvider,

    getTextModel,

    testConnection,

    transcribeAudio,

    generateSummary,

    generateMindMap,

    generateFlashcards
};