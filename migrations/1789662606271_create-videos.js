exports.up = (pgm) => {
    pgm.createTable('videos', {
        id: {
            type: 'bigserial',
            primaryKey: true
        },

        drive_file_id: {
            type: 'varchar(255)',
            notNull: true,
            unique: true
        },

        name: {
            type: 'varchar(255)',
            notNull: true
        },

        mime_type: {
            type: 'varchar(100)',
            notNull: true
        },

        duration_seconds: {
            type: 'integer',
            check: 'duration_seconds >= 0'
        },

        size_bytes: {
            type: 'bigint',
            check: 'size_bytes >= 0'
        },

        folder_id: {
            type: 'bigint',
            notNull: true,
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
        'videos',
        'folder_id'
    );
};

exports.down = (pgm) => {
    pgm.dropTable('videos');
};