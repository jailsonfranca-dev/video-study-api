exports.up = (pgm) => {

    pgm.addColumn(
        'video_images',
        {
            drive_file_id: {
                type: 'varchar(255)',
                notNull: false
            }
        }
    );

};


exports.down = (pgm) => {

    pgm.dropColumn(
        'video_images',
        'drive_file_id'
    );

};