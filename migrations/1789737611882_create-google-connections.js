exports.up = (pgm) => {
    pgm.createTable('google_connections', {
        id: {
            type: 'bigserial',
            primaryKey: true
        },

        user_id: {
            type: 'bigint',
            notNull: true,
            unique: true,
            references: 'users',
            onDelete: 'CASCADE'
        },

        refresh_token_encrypted: {
            type: 'text',
            notNull: true
        },

        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        },

        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });
};

exports.down = (pgm) => {
    pgm.dropTable('google_connections');
};
