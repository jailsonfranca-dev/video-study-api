const {
    prepareVideoAudio,
    cleanupPreparedMedia
} =
    require(
        './mediaPreparationService'
    );


// const {
//     transcribeAudio
// } =
//     require(
//         './geminiService'
//     );

const {
    transcribeAudio
} =
    require(
        './ai/aiService'
    );


const videoTranscriptRepository =
    require(
        '../repositories/videoTranscriptRepository'
    );


async function transcribeVideo(
    userId,
    videoId
) {

    let preparedMedia =
        null;


    try {

        /*
         * 1. Google Drive
         * 2. Download
         * 3. FFmpeg
         */
        preparedMedia =
            await prepareVideoAudio(
                userId,
                videoId
            );


        console.log(
            'Áudio preparado:',
            preparedMedia.audioPath
        );


        /*
         * 4. Gemini
         */
        const transcription =
            await transcribeAudio(
                preparedMedia.audioPath
            );


        console.log(
            'Transcrição concluída.'
        );


        /*
         * 5. PostgreSQL
         */
        const savedTranscript =
            await videoTranscriptRepository
                .upsert({

                    videoId,

                    transcript:
                    transcription
                        .transcript,

                    language:
                    transcription
                        .language,

                    transcriptionModel:
                    transcription
                        .model
                });


        console.log(
            'Transcrição salva no PostgreSQL.'
        );


        return {

            id:
                String(
                    savedTranscript.id
                ),

            videoId:
                String(
                    savedTranscript.video_id
                ),

            transcript:
            savedTranscript.transcript,

            language:
            savedTranscript.language,

            transcriptionModel:
            savedTranscript
                .transcription_model,

            createdAt:
            savedTranscript.created_at,

            updatedAt:
            savedTranscript.updated_at
        };


    } finally {

        /*
         * Mesmo se Gemini ou PostgreSQL
         * falharem, removemos:
         *
         * source.mp4
         * audio.mp3
         */
        if (
            preparedMedia
        ) {

            await cleanupPreparedMedia(
                preparedMedia
            );


            console.log(
                'Arquivos locais temporários removidos.'
            );

        }

    }

}


module.exports = {
    transcribeVideo
};