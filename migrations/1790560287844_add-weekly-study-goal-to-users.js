exports.up = (pgm) => {

    pgm.addColumn(
        'users',
        {
            weekly_study_goal: {
                type: 'integer',
                notNull: true,
                default: 15
            }
        }
    );


    pgm.addConstraint(
        'users',
        'chk_users_weekly_study_goal',
        {
            check:
                'weekly_study_goal >= 1 AND weekly_study_goal <= 100'
        }
    );

};


exports.down = (pgm) => {

    pgm.dropConstraint(
        'users',
        'chk_users_weekly_study_goal'
    );


    pgm.dropColumn(
        'users',
        'weekly_study_goal'
    );

};