const Groq =
    require(
        'groq-sdk'
    );


let client =
    null;


function getGroqClient() {

    if (
        !process.env.GROQ_API_KEY
    ) {

        throw new Error(
            'GROQ_API_KEY não configurada.'
        );

    }


    if (!client) {

        client =
            new Groq({

                apiKey:
                process.env
                    .GROQ_API_KEY

            });

    }


    return client;
}


function getGroqTextModel() {

    return (
        process.env
            .GROQ_TEXT_MODEL ||
        'openai/gpt-oss-20b'
    );

}


function getGroqTranscriptionModel() {

    return (
        process.env
            .GROQ_TRANSCRIPTION_MODEL ||
        'whisper-large-v3-turbo'
    );

}


module.exports = {

    getGroqClient,

    getGroqTextModel,

    getGroqTranscriptionModel
};