const {
    GoogleGenAI
} =
    require('@google/genai');


let client = null;

function getGeminiFallbackModel() {

    return (
        process.env
            .GEMINI_FALLBACK_MODEL ||
        'gemini-3.5-flash-lite'
    );
}


function getGeminiClient() {

    if (
        !process.env.GEMINI_API_KEY
    ) {

        throw new Error(
            'GEMINI_API_KEY não configurada.'
        );

    }


    if (!client) {

        client =
            new GoogleGenAI({
                apiKey:
                process.env
                    .GEMINI_API_KEY
            });

    }


    return client;
}


function getGeminiTextModel() {

    return (
        process.env
            .GEMINI_TEXT_MODEL ||
        'gemini-3.8-flash'
    );
}


function getGeminiTranscriptionModel() {

    return (
        process.env
            .GEMINI_TRANSCRIPTION_MODEL ||
        'gemini-3.5-transcribe'
    );
}


module.exports = {

    getGeminiClient,

    getGeminiTextModel,

    getGeminiFallbackModel,

    getGeminiTranscriptionModel
};