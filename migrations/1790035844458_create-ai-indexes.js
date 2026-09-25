exports.up = (pgm) => {

    pgm.createIndex(
        'video_study_materials',
        'status',
        {
            name:
                'idx_video_study_materials_status'
        }
    );

};
exports.down = (pgm) => {

    pgm.dropIndex(
        'video_study_materials',
        'status',
        {
            name:
                'idx_video_study_materials_status'
        }
    );

};