const videoTranscriptRepository =
    require(
        '../repositories/videoTranscriptRepository'
    );


const videoStudyMaterialRepository =
    require(
        '../repositories/videoStudyMaterialRepository'
    );
const videoFlashcardRepository =
    require(
        '../repositories/videoFlashcardRepository'
    );

const {
    transcribeVideo
} =
    require(
        './videoTranscriptionService'
    );


// const {
//     generateSummary,
//     generateMindMap,
//     generateFlashcards
// } =
//     require(
//         './geminiService'
//     );

const {

    getTextModel,

    generateSummary,

    generateMindMap,

    generateFlashcards

} =
    require(
        './ai/aiService'
    );


const {
    formatSummaryAsMarkdown
} =
    require(
        '../utils/summaryFormatter'
    );

// const {
//     getGeminiTextModel
// } =
//     require(
//         '../config/gemini'
//     );


const AppError =
    require(
        '../errors/AppError'
    );




async function generateVideoSummary(
    videoId
) {

    /*
     * 1. Procurar transcrição.
     */
    const transcript =
        await videoTranscriptRepository
            .findByVideoId(
                videoId
            );


    if (!transcript) {

        throw new AppError(
            'Este vídeo ainda não possui transcrição.',
            404
        );

    }

/*
    const {
        getGeminiTextModel
    } =
        require(
            '../config/gemini'
        );

*/
    const model =
        getTextModel();


    /*
     * 2. Marcar material como
     * processamento.
     */
    await videoStudyMaterialRepository
        .markAsProcessing(
            videoId,
            model
        );


    try {

        console.log(
            'Gerando resumo com IA...'
        );


        /*
         * 3. Gemini.
         */
        const generated =
            await generateSummary(
                transcript.transcript
            );


        /*
         * 4. Converter JSON estruturado
         * para Markdown.
         */
        const markdown =
            formatSummaryAsMarkdown(
                generated.data
            );


        /*
         * 5. PostgreSQL.
         */
        const material =
            await videoStudyMaterialRepository
                .saveSummary({

                    videoId,

                    summary:
                    markdown,

                    generationModel:
                    generated.model
                });


        console.log(
            'Resumo salvo no PostgreSQL.'
        );
        const finalMaterial =
            await refreshMaterialStatus(
                videoId
            );


        return {

            id:
                String(
                    material.id
                ),

            videoId:
                String(
                    material.video_id
                ),

            summary:
            material.summary,

            generationModel:
            material
                .generation_model,

            status:
            finalMaterial.status,

            generatedAt:
            finalMaterial
                .generated_at,

            createdAt:
            material.created_at,

            updatedAt:
            finalMaterial
                .updated_at
        };


    } catch (error) {

        /*
         * Guardamos uma mensagem curta.
         */
        const errorMessage =
            String(
                error?.message ??
                error
            ).substring(
                0,
                2000
            );


        await videoStudyMaterialRepository
            .markAsFailed(
                videoId,
                errorMessage
            );


        throw error;

    }

}

async function generateVideoMindMap(
    videoId
) {

    /*
     * 1. Obter transcrição já salva.
     */
    const transcript =
        await videoTranscriptRepository
            .findByVideoId(
                videoId
            );


    if (!transcript) {

        throw new AppError(
            'Este vídeo ainda não possui transcrição.',
            404
        );

    }


    const model =
        getTextModel();


    /*
     * 2. Material está sendo processado.
     */
    await videoStudyMaterialRepository
        .markAsProcessing(
            videoId,
            model
        );


    try {

        console.log(
            'Gerando mapa mental com IA...'
        );


        /*
         * 3. IA
         */
        const generated =
            await generateMindMap(
                transcript.transcript
            );


        /*
         * 4. PostgreSQL
         */
        const material =
            await videoStudyMaterialRepository
                .saveMindMap({

                    videoId,

                    mindMap:
                    generated.data,

                    generationModel:
                    generated.model
                });


        console.log(
            'Mapa mental salvo no PostgreSQL.'
        );
        const finalMaterial =
            await refreshMaterialStatus(
                videoId
            );


        return {

            id:
                String(
                    material.id
                ),

            videoId:
                String(
                    material.video_id
                ),

            mindMap:
            material.mind_map,

            generationModel:
            material
                .generation_model,

            status:
            finalMaterial.status,

            generatedAt:
            finalMaterial.generated_at,

            createdAt:
            material.created_at,

            updatedAt:
            material.updated_at
        };


    } catch (error) {

        const errorMessage =
            String(
                error?.message ??
                error
            ).substring(
                0,
                2000
            );


        await videoStudyMaterialRepository
            .markAsFailed(
                videoId,
                errorMessage
            );


        throw error;

    }

}

async function generateVideoFlashcards(
    videoId
) {

    /*
     * 1. Encontrar transcrição.
     */
    const transcript =
        await videoTranscriptRepository
            .findByVideoId(
                videoId
            );


    if (!transcript) {

        throw new AppError(
            'Este vídeo ainda não possui transcrição.',
            404
        );

    }


    const model =
        getTextModel();


    /*
     * 2. Obter/criar material e
     * marcar como processing.
     */
    const material =
        await videoStudyMaterialRepository
            .markAsProcessing(
                videoId,
                model
            );


    try {

        console.log(
            'Gerando flashcards com IA...'
        );


        /*
         * 3. Gemini.
         */
        const generated =
            await generateFlashcards(
                transcript.transcript
            );


        const flashcards =
            generated.data.flashcards;


        /*
         * Segurança adicional.
         */
        if (
            flashcards.length !== 10
        ) {

            throw new Error(
                'A geração precisa conter exatamente 10 flashcards.'
            );

        }


        /*
         * 4. Substituímos o conjunto
         * anterior em transaction.
         */
        const savedFlashcards =
            await videoFlashcardRepository
                .replaceByStudyMaterialId(
                    material.id,
                    flashcards
                );


        console.log(
            '10 flashcards salvos no PostgreSQL.'
        );


        /*
         * 5. Verifica:
         *
         * summary?
         * mind_map?
         * 10 flashcards?
         */
        let finalMaterial =
            await videoStudyMaterialRepository
                .markAsCompletedIfReady(
                    videoId
                );


        /*
         * Se ainda estiver faltando
         * resumo ou mapa mental,
         * volta para pending.
         */
        if (!finalMaterial) {

            finalMaterial =
                await videoStudyMaterialRepository
                    .markAsPending(
                        videoId
                    );

        }


        return {

            videoId:
                String(
                    videoId
                ),

            studyMaterialId:
                String(
                    material.id
                ),

            generationModel:
            generated.model,

            status:
            finalMaterial.status,

            generatedAt:
            finalMaterial.generated_at,

            flashcards:
                savedFlashcards.map(
                    flashcard => ({

                        id:
                            String(
                                flashcard.id
                            ),

                        position:
                        flashcard.position,

                        question:
                        flashcard.question,

                        answer:
                        flashcard.answer

                    })
                )
        };


    } catch (error) {

        const errorMessage =
            String(
                error?.message ??
                error
            ).substring(
                0,
                2000
            );


        await videoStudyMaterialRepository
            .markAsFailed(
                videoId,
                errorMessage
            );


        throw error;

    }

}
async function refreshMaterialStatus(
    videoId
) {

    let material =
        await videoStudyMaterialRepository
            .markAsCompletedIfReady(
                videoId
            );


    if (!material) {

        material =
            await videoStudyMaterialRepository
                .markAsPending(
                    videoId
                );

    }


    return material;
}

async function getVideoStudyMaterial(
    videoId
) {

    const transcript =
        await videoTranscriptRepository
            .findByVideoId(
                videoId
            );


    const material =
        await videoStudyMaterialRepository
            .findByVideoId(
                videoId
            );


    /*
     * Vídeo ainda não possui
     * material gerado.
     */
    if (!material) {

        return {

            videoId:
                String(
                    videoId
                ),

            generated:
                false,

            transcriptAvailable:
                Boolean(
                    transcript
                ),

            status:
                'not_generated',

            summary:
                null,

            mindMap:
                null,

            flashcards:
                [],

            generatedAt:
                null
        };

    }


    const flashcards =
        await videoFlashcardRepository
            .findByStudyMaterialId(
                material.id
            );


    return {

        videoId:
            String(
                material.video_id
            ),

        generated:
            true,

        transcriptAvailable:
            Boolean(
                transcript
            ),

        status:
        material.status,

        summary:
        material.summary,

        mindMap:
        material.mind_map,

        flashcards:
            flashcards.map(
                flashcard => ({

                    id:
                        String(
                            flashcard.id
                        ),

                    position:
                    flashcard.position,

                    question:
                    flashcard.question,

                    answer:
                    flashcard.answer

                })
            ),

        generationModel:
        material
            .generation_model,

        errorMessage:
        material
            .error_message,

        generatedAt:
        material
            .generated_at,

        createdAt:
        material
            .created_at,

        updatedAt:
        material
            .updated_at
    };
}

async function generateCompleteStudyMaterial(
    userId,
    videoId
) {

    const existingMaterial =
        await getVideoStudyMaterial(
            videoId
        );


    if (
        existingMaterial.generated &&
        existingMaterial.status ===
        'completed'
    ) {

        return existingMaterial;

    }

    /*
     * 1. Descobrir se já existe
     * transcrição.
     */
    let transcript =
        await videoTranscriptRepository
            .findByVideoId(
                videoId
            );


    /*
     * Caso não exista:
     *
     * Drive
     * → FFmpeg
     * → Gemini Transcribe
     */
    if (!transcript) {

        console.log(
            'Transcrição inexistente.'
        );


        console.log(
            'Iniciando transcrição do vídeo...'
        );


        await transcribeVideo(
            userId,
            videoId
        );


        transcript =
            await videoTranscriptRepository
                .findByVideoId(
                    videoId
                );

    }


    if (!transcript) {

        throw new AppError(
            'Não foi possível gerar a transcrição do vídeo.',
            500
        );

    }


    /*
     * 2. Resumo
     */
    console.log(
        'Gerando resumo...'
    );


    let existing =
        await getVideoStudyMaterial(
            videoId
        );
    if (!existing.summary) {

        await generateVideoSummary(
            videoId
        );

    }


    existing =
        await getVideoStudyMaterial(
            videoId
        );


    if (!existing.mindMap) {

        await generateVideoMindMap(
            videoId
        );

    }


    existing =
        await getVideoStudyMaterial(
            videoId
        );


    if (
        existing.flashcards.length !== 10
    ) {

        await generateVideoFlashcards(
            videoId
        );

    }


    /*
     * 5. Material final.
     */
    return getVideoStudyMaterial(
        videoId
    );
}


module.exports = {
    getVideoStudyMaterial,

    generateCompleteStudyMaterial,

    generateVideoSummary,

    generateVideoMindMap,

    generateVideoFlashcards
};