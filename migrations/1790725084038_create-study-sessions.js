exports.up = (pgm) => {

    pgm.createTable(
        'study_sessions',
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


            started_at: {
                type: 'timestamptz',
                notNull: true,
                default:
                    pgm.func(
                        'CURRENT_TIMESTAMP'
                    )
            },


            ended_at: {
                type: 'timestamptz',
                notNull: false
            },


            watched_seconds: {
                type: 'integer',
                notNull: true,
                default: 0
            },


            start_position_seconds: {
                type: 'integer',
                notNull: false
            },


            end_position_seconds: {
                type: 'integer',
                notNull: false
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


    /*
     * Tempo estudado nunca pode
     * ser negativo.
     */
    pgm.addConstraint(
        'study_sessions',
        'chk_study_sessions_watched_seconds',
        {
            check:
                'watched_seconds >= 0'
        }
    );


    /*
     * Posição inicial também
     * não pode ser negativa.
     */
    pgm.addConstraint(
        'study_sessions',
        'chk_study_sessions_start_position',
        {
            check:
                `
                start_position_seconds IS NULL
                OR
                start_position_seconds >= 0
                `
        }
    );


    /*
     * Posição final não pode
     * ser negativa.
     */
    pgm.addConstraint(
        'study_sessions',
        'chk_study_sessions_end_position',
        {
            check:
                `
                end_position_seconds IS NULL
                OR
                end_position_seconds >= 0
                `
        }
    );


    /*
     * Uma sessão não pode terminar
     * antes de começar.
     */
    pgm.addConstraint(
        'study_sessions',
        'chk_study_sessions_dates',
        {
            check:
                `
                ended_at IS NULL
                OR
                ended_at >= started_at
                `
        }
    );


    /*
     * Consultas do histórico
     * do usuário.
     */
    pgm.createIndex(
        'study_sessions',
        [
            'user_id',
            'started_at'
        ],
        {
            name:
                'idx_study_sessions_user_started_at'
        }
    );


    /*
     * Consultas por vídeo.
     */
    pgm.createIndex(
        'study_sessions',
        [
            'video_id',
            'started_at'
        ],
        {
            name:
                'idx_study_sessions_video_started_at'
        }
    );

};


exports.down = (pgm) => {

    pgm.dropTable(
        'study_sessions'
    );

};