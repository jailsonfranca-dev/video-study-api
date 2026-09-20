exports.up = (pgm) => {
    pgm.createTable('video_progress', {
        id: {
            type: 'bigserial',
            primaryKey: true
        },

        user_id: {
            type: 'bigint',
            notNull: true,
            references: 'users',
            onDelete: 'CASCADE'
        },

        video_id: {
            type: 'bigint',
            notNull: true,
            references: 'videos',
            onDelete: 'CASCADE'
        },

        current_time_seconds: {
            type: 'integer',
            notNull: true,
            default: 0,
            check: 'current_time_seconds >= 0'
        },

        percentage: {
            type: 'numeric(5,2)',
            notNull: true,
            default: 0,
            check: 'percentage >= 0 AND percentage <= 100'
        },

        completed: {
            type: 'boolean',
            notNull: true,
            default: false
        },

        last_watched_at: {
            type: 'timestamptz'
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

    pgm.addConstraint(
        'video_progress',
        'video_progress_user_video_unique',
        {
            unique: ['user_id', 'video_id']
        }
    );

    pgm.createIndex(
        'video_progress',
        'video_id'
    );
};

exports.down = (pgm) => {
    pgm.dropTable('video_progress');
};