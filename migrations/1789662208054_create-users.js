exports.up = (pgm) => {
    pgm.createTable('users', {
        id: {
            type: 'bigserial',
            primaryKey: true
        },

        name: {
            type: 'varchar(120)',
            notNull: true
        },

        email: {
            type: 'varchar(255)',
            notNull: true,
            unique: true
        },

        password_hash: {
            type: 'varchar(255)',
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
    pgm.dropTable('users');
};