exports.up = (pgm) => {

    pgm.createTable(
        'study_time_daily',
        {

            id: {
                type: 'bigserial',
                primaryKey: true
            },


            user_id: {
                type: 'bigint',
                notNull: true,
                references: 'users(id)',
                onDelete: 'CASCADE'
            },


            video_id: {
                type: 'bigint',
                notNull: true,
                references: 'videos(id)',
                onDelete: 'CASCADE'
            },


            study_date: {
                type: 'date',
                notNull: true
            },


            watched_seconds: {
                type: 'integer',
                notNull: true,
                default: 0
            },


            created_at: {
                type: 'timestamptz',
                notNull: true,
                default:
                    pgm.func(
                        'CURRENT_TIMESTAMP'
                    )
            },


            updated_at: {
                type: 'timestamptz',
                notNull: true,
                default:
                    pgm.func(
                        'CURRENT_TIMESTAMP'
                    )
            }

        }
    );


    pgm.addConstraint(
        'study_time_daily',
        'chk_study_time_daily_watched_seconds',
        {
            check:
                'watched_seconds >= 0'
        }
    );


    pgm.addConstraint(
        'study_time_daily',
        'uq_study_time_daily_user_video_date',
        {
            unique: [
                'user_id',
                'video_id',
                'study_date'
            ]
        }
    );


    pgm.createIndex(
        'study_time_daily',
        [
            'user_id',
            'study_date'
        ],
        {
            name:
                'idx_study_time_daily_user_date'
        }
    );

};


exports.down = (pgm) => {

    pgm.dropTable(
        'study_time_daily'
    );

};