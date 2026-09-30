const express =
    require(
        'express'
    );


const dashboardController =
    require(
        '../controllers/dashboardController'
    );


const authenticate =
    require(
        '../middlewares/authenticate'
    );


const router =
    express.Router();


router.use(
    authenticate
);


router.get(
    '/summary',
    dashboardController.summary
);


router.get(
    '/week',
    dashboardController.week
);


router.get(
    '/calendar',
    dashboardController.calendar
);
router.patch(
    '/weekly-goal',
    dashboardController.updateWeeklyGoal
);


router.get(
    '/continue-studying',
    dashboardController.continueStudying
);

router.get(
    '/recent-activity',
    dashboardController.recentActivity
);

router.get(
    '/study-time',
    dashboardController.studyTime
);

router.patch(
    '/study-time-goal',
    dashboardController.updateStudyTimeGoal
);

router.get(
    '/study-sessions',
    dashboardController.studySessions
);


module.exports =
    router;