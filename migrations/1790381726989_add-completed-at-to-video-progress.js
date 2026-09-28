exports.up = (pgm) => {

    pgm.addColumn(
        'video_progress',
        {
            completed_at: {
                type: 'timestamptz',
                notNull: false
            }
        }
    );


    pgm.createIndex(
        'video_progress',
        'completed_at',
        {
            name:
                'idx_video_progress_completed_at'
        }
    );
};


exports.down = (pgm) => {

    pgm.dropIndex(
        'video_progress',
        'completed_at',
        {
            name:
                'idx_video_progress_completed_at'
        }
    );


    pgm.dropColumn(
        'video_progress',
        'completed_at'
    );
};