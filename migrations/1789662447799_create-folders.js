exports.up = (pgm) => {
    pgm.createTable('folders', {
        id: {
            type: 'bigserial',
            primaryKey: true
        },

        drive_folder_id: {
            type: 'varchar(255)',
            notNull: true,
            unique: true
        },

        name: {
            type: 'varchar(255)',
            notNull: true
        },

        parent_folder_id: {
            type: 'bigint',
            references: 'folders',
            onDelete: 'CASCADE'
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

    pgm.createIndex(
        'folders',
        'parent_folder_id'
    );
};

exports.down = (pgm) => {
    pgm.dropTable('folders');
};