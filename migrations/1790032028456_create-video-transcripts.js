exports.up = (pgm) => {

    pgm.createTable(
        'video_transcripts',
        {

            id: {
                type: 'bigserial',
                primaryKey: true
            },

            video_id: {
                type: 'bigint',
                notNull: true
            },

            transcript: {
                type: 'text',
                notNull: true
            },

            language: {
                type: 'varchar(20)'
            },

            transcription_model: {
                type: 'varchar(100)'
            },

            created_at: {
                type: 'timestamptz',
                notNull: true,
                default:
                    pgm.func(
                        'current_timestamp'
                    )
            },

            updated_at: {
                type: 'timestamptz',
                notNull: true,
                default:
                    pgm.func(
                        'current_timestamp'
                    )
            }
        }
    );


    pgm.addConstraint(
        'video_transcripts',
        'fk_video_transcripts_video',
        {
            foreignKeys: {

                columns:
                    'video_id',

                references:
                    'videos(id)',

                onDelete:
                    'CASCADE'
            }
        }
    );


    pgm.addConstraint(
        'video_transcripts',
        'uq_video_transcripts_video',
        {
            unique: [
                'video_id'
            ]
        }
    );
};


exports.down = (pgm) => {

    pgm.dropTable(
        'video_transcripts'
    );

};