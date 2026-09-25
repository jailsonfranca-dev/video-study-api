const studyMaterialService =
    require(
        '../services/studyMaterialService'
    );


async function get(
    req,
    res,
    next
) {

    try {

        const {
            id
        } =
            req.params;


        const material =
            await studyMaterialService
                .getVideoStudyMaterial(
                    id
                );


        return res
            .status(200)
            .json(
                material
            );


    } catch (error) {

        next(
            error
        );

    }

}


async function generate(
    req,
    res,
    next
) {

    try {

        const {
            id
        } =
            req.params;


        const material =
            await studyMaterialService
                .generateCompleteStudyMaterial(
                    req.user.id,
                    id
                );


        return res
            .status(200)
            .json({

                message:
                    'Material de estudo gerado com sucesso.',

                material
            });


    } catch (error) {

        next(
            error
        );

    }

}


async function regenerateSummary(
    req,
    res,
    next
) {

    try {

        const {
            id
        } =
            req.params;


        const result =
            await studyMaterialService
                .generateVideoSummary(
                    id
                );


        return res
            .status(200)
            .json({

                message:
                    'Resumo regenerado com sucesso.',

                data: {

                    videoId:
                    result.videoId,

                    summary:
                    result.summary,

                    generationModel:
                    result.generationModel,

                    status:
                    result.status,

                    generatedAt:
                    result.generatedAt,

                    updatedAt:
                    result.updatedAt

                }

            });


    } catch (error) {

        next(
            error
        );

    }

}


async function regenerateMindMap(
    req,
    res,
    next
) {

    try {

        const {
            id
        } =
            req.params;


        const result =
            await studyMaterialService
                .generateVideoMindMap(
                    id
                );


        return res
            .status(200)
            .json({

                message:
                    'Mapa mental regenerado com sucesso.',

                data: {

                    videoId:
                    result.videoId,

                    mindMap:
                    result.mindMap,

                    generationModel:
                    result.generationModel,

                    status:
                    result.status,

                    generatedAt:
                    result.generatedAt,

                    updatedAt:
                    result.updatedAt

                }

            });


    } catch (error) {

        next(
            error
        );

    }

}


async function regenerateFlashcards(
    req,
    res,
    next
) {

    try {

        const {
            id
        } =
            req.params;


        const result =
            await studyMaterialService
                .generateVideoFlashcards(
                    id
                );


        return res
            .status(200)
            .json({

                message:
                    'Flashcards regenerados com sucesso.',

                data: {

                    videoId:
                    result.videoId,

                    studyMaterialId:
                    result.studyMaterialId,

                    flashcards:
                    result.flashcards,

                    generationModel:
                    result.generationModel,

                    status:
                    result.status,

                    generatedAt:
                    result.generatedAt

                }

            });


    } catch (error) {

        next(
            error
        );

    }

}


module.exports = {

    get,

    generate,

    regenerateSummary,

    regenerateMindMap,

    regenerateFlashcards
};