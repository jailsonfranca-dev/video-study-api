const pool = require('../config/database');

async function create({ name, email, passwordHash }) {
    const query = `
        INSERT INTO users (
            name,
            email,
            password_hash
        )
        VALUES ($1, $2, $3)
        RETURNING
            id,
            name,
            email,
            created_at,
            updated_at
    `;

    const values = [
        name,
        email,
        passwordHash
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}

async function findAll() {
    const query = `
        SELECT
            id,
            name,
            email,
            created_at,
            updated_at
        FROM users
        ORDER BY id
    `;

    const result = await pool.query(query);

    return result.rows;
}

async function findById(id) {
    const query = `
        SELECT
            id,
            name,
            email,
            created_at,
            updated_at
        FROM users
        WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
}

async function findByEmail(email) {
    const query = `
        SELECT *
        FROM users
        WHERE email = $1
    `;

    const result = await pool.query(query, [email]);

    return result.rows[0];
}

async function update({
                          id,
                          name,
                          email,
                          passwordHash
                      }) {

    let query;
    let values;

    if (passwordHash) {

        query = `
            UPDATE users
            SET
                name = $1,
                email = $2,
                password_hash = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING
                id,
                name,
                email,
                created_at,
                updated_at
        `;

        values = [
            name,
            email,
            passwordHash,
            id
        ];

    } else {

        query = `
            UPDATE users
            SET
                name = $1,
                email = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING
                id,
                name,
                email,
                created_at,
                updated_at
        `;

        values = [
            name,
            email,
            id
        ];
    }

    const result = await pool.query(query, values);

    return result.rows[0];
}

async function remove(id) {
    const query = `
        DELETE FROM users
        WHERE id = $1
        RETURNING id
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
}

module.exports = {
    create,
    findAll,
    findById,
    findByEmail,
    update,
    remove
};