exports.up = (pgm) => {

    pgm.addColumn(
        'users',
        {

            weekly_study_minutes: {
                type: 'integer',
                notNull: true,
                default: 600
            }

        }
    );


    pgm.addConstraint(
        'users',
        'chk_users_weekly_study_minutes',
        {
            check:
                'weekly_study_minutes >= 1 AND weekly_study_minutes <= 10080'
        }
    );

};


exports.down = (pgm) => {

    pgm.dropConstraint(
        'users',
        'chk_users_weekly_study_minutes'
    );


    pgm.dropColumn(
        'users',
        'weekly_study_minutes'
    );

};