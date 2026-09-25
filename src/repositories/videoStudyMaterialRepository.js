const pool =
    require('../config/database');


async function findByVideoId(
    videoId,
    db = pool
) {

    const query = `
        SELECT
            id,
            video_id,
            summary,
            mind_map,
            generation_model,
            status,
            error_message,
            generated_at,
            created_at,
            updated_at

        FROM video_study_materials

        WHERE video_id = $1
    `;


    const result =
        await db.query(
            query,
            [
                videoId
            ]
        );


    return result.rows[0];
}


async function markAsProcessing(
    videoId,
    generationModel,
    db = pool
) {

    const query = `
        INSERT INTO video_study_materials (
            video_id,
            generation_model,
            status
        )

        VALUES (
            $1,
            $2,
            'processing'
        )

        ON CONFLICT (video_id)

        DO UPDATE SET
            generation_model =
                EXCLUDED.generation_model,

            status =
                'processing',

            error_message =
                NULL,
                
            generated_at =
                NULL,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            video_id,
            summary,
            mind_map,
            generation_model,
            status,
            error_message,
            generated_at,
            created_at,
            updated_at
    `;


    const result =
        await db.query(
            query,
            [
                videoId,
                generationModel
            ]
        );


    return result.rows[0];
}


async function saveSummary(
    {
        videoId,
        summary,
        generationModel
    },
    db = pool
) {

    const query = `
        INSERT INTO video_study_materials (
            video_id,
            summary,
            generation_model,
            status
        )

        VALUES (
            $1,
            $2,
            $3,
            'pending'
        )

        ON CONFLICT (video_id)

        DO UPDATE SET
            summary =
                EXCLUDED.summary,

            generation_model =
                EXCLUDED.generation_model,

            status =
                'pending',

            error_message =
                NULL,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            video_id,
            summary,
            mind_map,
            generation_model,
            status,
            error_message,
            generated_at,
            created_at,
            updated_at
    `;


    const result =
        await db.query(
            query,
            [
                videoId,
                summary,
                generationModel
            ]
        );


    return result.rows[0];
}


async function markAsFailed(
    videoId,
    errorMessage,
    db = pool
) {

    const query = `
        UPDATE video_study_materials

        SET
            status =
                'failed',

            error_message =
                $2,

            updated_at =
                CURRENT_TIMESTAMP

        WHERE video_id = $1

        RETURNING
            id,
            video_id,
            status,
            error_message,
            updated_at
    `;


    const result =
        await db.query(
            query,
            [
                videoId,
                errorMessage
            ]
        );


    return result.rows[0];
}

async function saveMindMap(
    {
        videoId,
        mindMap,
        generationModel
    },
    db = pool
) {

    const query = `
        INSERT INTO video_study_materials (
            video_id,
            mind_map,
            generation_model,
            status
        )

        VALUES (
            $1,
            $2::jsonb,
            $3,
            'pending'
        )

        ON CONFLICT (video_id)

        DO UPDATE SET
            mind_map =
                EXCLUDED.mind_map,

            generation_model =
                EXCLUDED.generation_model,

            status =
                'pending',

            error_message =
                NULL,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            video_id,
            summary,
            mind_map,
            generation_model,
            status,
            error_message,
            generated_at,
            created_at,
            updated_at
    `;


    const values = [

        videoId,

        JSON.stringify(
            mindMap
        ),

        generationModel
    ];


    const result =
        await db.query(
            query,
            values
        );


    return result.rows[0];
}

async function markAsCompletedIfReady(
    videoId,
    db = pool
) {

    const query = `
        UPDATE video_study_materials vsm

        SET
            status =
                'completed',

            error_message =
                NULL,

            generated_at =
                CURRENT_TIMESTAMP,

            updated_at =
                CURRENT_TIMESTAMP

        WHERE
            vsm.video_id = $1

            AND vsm.summary IS NOT NULL

            AND LENGTH(
                TRIM(
                    vsm.summary
                )
            ) > 0

            AND vsm.mind_map IS NOT NULL

            AND (
                SELECT
                    COUNT(*)

                FROM video_flashcards vf

                WHERE
                    vf.study_material_id =
                        vsm.id
            ) = 10

        RETURNING
            id,
            video_id,
            summary,
            mind_map,
            generation_model,
            status,
            error_message,
            generated_at,
            created_at,
            updated_at
    `;


    const result =
        await db.query(
            query,
            [
                videoId
            ]
        );


    return result.rows[0];
}

async function markAsPending(
    videoId,
    db = pool
) {

    const query = `
        UPDATE video_study_materials

        SET
            status =
                'pending',

            error_message =
                NULL,

            generated_at =
                NULL,

            updated_at =
                CURRENT_TIMESTAMP

        WHERE video_id = $1

        RETURNING
            id,
            video_id,
            summary,
            mind_map,
            generation_model,
            status,
            error_message,
            generated_at,
            created_at,
            updated_at
    `;


    const result =
        await db.query(
            query,
            [
                videoId
            ]
        );


    return result.rows[0];
}


module.exports = {

    findByVideoId,

    markAsProcessing,

    saveSummary,

    saveMindMap,

    markAsCompletedIfReady,

    markAsPending,

    markAsFailed
};