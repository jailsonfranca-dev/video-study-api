const dashboardService =
    require(
        '../services/dashboardService'
    );


async function summary(
    req,
    res,
    next
) {

    try {

        const result =
            await dashboardService
                .getSummary(
                    req.user.id
                );


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        next(
            error
        );

    }

}


async function week(
    req,
    res,
    next
) {

    try {

        const result =
            await dashboardService
                .getWeek(
                    req.user.id
                );


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        next(
            error
        );

    }

}


async function calendar(
    req,
    res,
    next
) {

    try {

        const now =
            new Date();


        const year =
            Number(
                req.query.year ??
                now.getFullYear()
            );


        const month =
            Number(
                req.query.month ??
                now.getMonth() + 1
            );


        const result =
            await dashboardService
                .getCalendar(
                    req.user.id,
                    year,
                    month
                );


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        next(
            error
        );

    }

}


async function continueStudying(
    req,
    res,
    next
) {

    try {

        const result =
            await dashboardService
                .getContinueStudying(
                    req.user.id
                );


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        next(
            error
        );

    }

}
async function updateWeeklyGoal(
    req,
    res,
    next
) {

    try {

        const result =
            await dashboardService
                .updateWeeklyGoal(
                    req.user.id,
                    req.body.target
                );


        return res
            .status(200)
            .json({

                message:
                    'Meta semanal atualizada com sucesso.',

                weeklyGoal:
                result

            });


    } catch (error) {

        next(
            error
        );

    }

}

async function recentActivity(
    req,
    res,
    next
) {

    try {

        const result =
            await dashboardService
                .getRecentActivity(
                    req.user.id
                );


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        next(
            error
        );

    }

}

async function studyTime(
    req,
    res,
    next
) {

    try {

        const result =
            await dashboardService
                .getStudyTime(
                    req.user.id
                );


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        next(
            error
        );

    }

}

async function updateStudyTimeGoal(
    req,
    res,
    next
) {

    try {

        const result =
            await dashboardService
                .updateWeeklyStudyTimeGoal(

                    req.user.id,

                    req.body.targetMinutes

                );


        return res
            .status(200)
            .json({

                message:
                    'Meta semanal de tempo atualizada com sucesso.',

                weeklyGoal:
                result

            });


    } catch (error) {

        next(
            error
        );

    }

}

async function studySessions(
    req,
    res,
    next
) {

    try {

        const result =
            await dashboardService
                .getStudySessions(

                    req.user.id,

                    req.query.limit

                );


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        next(
            error
        );

    }

}


module.exports = {

    summary,

    week,

    calendar,

    continueStudying,

    updateWeeklyGoal,

    recentActivity,

    studyTime,

    updateStudyTimeGoal,

    studySessions
};