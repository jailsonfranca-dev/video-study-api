const pool = require('../config/database');


async function findByUserId(userId) {

    const query = `
        SELECT
            id,
            user_id,
            refresh_token_encrypted,
            created_at,
            updated_at
        FROM google_connections
        WHERE user_id = $1
    `;

    const result = await pool.query(
        query,
        [userId]
    );

    return result.rows[0];
}


async function upsert({
                          userId,
                          refreshTokenEncrypted
                      }) {

    const query = `
        INSERT INTO google_connections (
            user_id,
            refresh_token_encrypted
        )
        VALUES ($1, $2)

        ON CONFLICT (user_id)

        DO UPDATE SET
            refresh_token_encrypted =
                EXCLUDED.refresh_token_encrypted,

            updated_at =
                CURRENT_TIMESTAMP

        RETURNING
            id,
            user_id,
            created_at,
            updated_at
    `;

    const result = await pool.query(
        query,
        [
            userId,
            refreshTokenEncrypted
        ]
    );

    return result.rows[0];
}


module.exports = {
    findByUserId,
    upsert
};