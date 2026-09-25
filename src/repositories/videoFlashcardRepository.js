const pool =
    require('../config/database');


async function replaceByStudyMaterialId(
    studyMaterialId,
    flashcards
) {

    const client =
        await pool.connect();


    try {

        await client.query(
            'BEGIN'
        );


        /*
         * Apaga a geração anterior.
         */
        await client.query(
            `
                DELETE FROM video_flashcards
                WHERE study_material_id = $1
            `,
            [
                studyMaterialId
            ]
        );


        const savedFlashcards =
            [];


        for (
            let index = 0;
            index < flashcards.length;
            index++
        ) {

            const flashcard =
                flashcards[index];


            const position =
                index + 1;


            const result =
                await client.query(
                    `
                        INSERT INTO video_flashcards (
                            study_material_id,
                            position,
                            question,
                            answer
                        )

                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4
                        )

                        RETURNING
                            id,
                            study_material_id,
                            position,
                            question,
                            answer,
                            created_at,
                            updated_at
                    `,
                    [
                        studyMaterialId,
                        position,
                        flashcard.question,
                        flashcard.answer
                    ]
                );


            savedFlashcards.push(
                result.rows[0]
            );

        }


        await client.query(
            'COMMIT'
        );


        return savedFlashcards;


    } catch (error) {

        await client.query(
            'ROLLBACK'
        );


        throw error;


    } finally {

        client.release();

    }

}


async function findByStudyMaterialId(
    studyMaterialId,
    db = pool
) {

    const query = `
        SELECT
            id,
            study_material_id,
            position,
            question,
            answer,
            created_at,
            updated_at

        FROM video_flashcards

        WHERE study_material_id = $1

        ORDER BY position ASC
    `;


    const result =
        await db.query(
            query,
            [
                studyMaterialId
            ]
        );


    return result.rows;
}


async function countByStudyMaterialId(
    studyMaterialId,
    db = pool
) {

    const query = `
        SELECT
            COUNT(*)::integer
                AS total

        FROM video_flashcards

        WHERE study_material_id = $1
    `;


    const result =
        await db.query(
            query,
            [
                studyMaterialId
            ]
        );


    return result.rows[0].total;
}


module.exports = {

    replaceByStudyMaterialId,

    findByStudyMaterialId,

    countByStudyMaterialId
};