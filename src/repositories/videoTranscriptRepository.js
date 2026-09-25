const pool =
    require('../config/database');


async function upsert(
    {
        videoId,
        transcript,
        language,
        transcriptionModel
    },
    db = pool
) {

    const query = `
        INSERT INTO video_transcripts (
            video_id,
            transcript,
            language,
            transcription_model
        )
        VALUES (
            $1,
            $2,
            $3,
            $4
        )

        ON CONFLICT (video_id)

        DO UPDATE SET
            transcript =
                EXCLUDED.transcript,

            language =
                EXCLUDED.language,

            transcription_model =
                EXCLUDED.transcription_model,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            video_id,
            transcript,
            language,
            transcription_model,
            created_at,
            updated_at
    `;


    const values = [
        videoId,
        transcript,
        language,
        transcriptionModel
    ];


    const result =
        await db.query(
            query,
            values
        );


    return result.rows[0];
}


async function findByVideoId(
    videoId,
    db = pool
) {

    const query = `
        SELECT
            id,
            video_id,
            transcript,
            language,
            transcription_model,
            created_at,
            updated_at

        FROM video_transcripts

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


module.exports = {
    upsert,
    findByVideoId
};