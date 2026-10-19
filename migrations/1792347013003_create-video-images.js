exports.up = (pgm) => {
    pgm.createTable('video_images', {
        id: {
            type: 'bigserial',
            primaryKey: true
        },
        video_id: {
            type: 'bigint',
            notNull: true,
            references: 'videos(id)',
            onDelete: 'CASCADE',
            unique: true
        },
        image_url: {
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

    pgm.addConstraint('video_images', 'uq_video_images_video', {
        unique: ['video_id']
    });
};

exports.down = (pgm) => {
    pgm.dropTable('video_images');
};