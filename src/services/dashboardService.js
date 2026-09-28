const AppError =
    require(
        '../errors/AppError'
    );

const dashboardRepository =
    require(
        '../repositories/dashboardRepository'
    );


const WEEK_DAYS = [
    'seg',
    'ter',
    'qua',
    'qui',
    'sex',
    'sab',
    'dom'
];

async function updateWeeklyGoal(
    userId,
    target
) {

    const numericTarget =
        Number(
            target
        );


    if (
        !Number.isInteger(
            numericTarget
        )
        ||
        numericTarget < 1
        ||
        numericTarget > 100
    ) {

        throw new AppError(
            'A meta semanal deve ser um número inteiro entre 1 e 100.',
            400
        );

    }


    const result =
        await dashboardRepository
            .updateWeeklyGoal(
                userId,
                numericTarget
            );


    if (!result) {

        throw new AppError(
            'Usuário não encontrado.',
            404
        );

    }


    return {

        target:
            Number(
                result.weekly_study_goal
            )

    };
}


async function getSummary(
    userId
) {

    const [
        data,
        streak
    ] =
        await Promise.all([

            dashboardRepository
                .getSummary(
                    userId
                ),

            dashboardRepository
                .getCurrentStreak(
                    userId
                )

        ]);


    const totalVideos =
        Number(
            data.total_videos ??
            0
        );


    const completedVideos =
        Number(
            data.completed_videos ??
            0
        );


    const completedToday =
        Number(
            data.completed_today ??
            0
        );


    const completedWeek =
        Number(
            data.completed_week ??
            0
        );


    const completedPreviousWeek =
        Number(
            data.completed_previous_week ??
            0
        );


    /*
     * Meta semanal armazenada
     * no usuário.
     */
    const weeklyGoal =
        Number(
            data.weekly_study_goal ??
            15
        );


    /*
     * Progresso da biblioteca.
     */
    const progressPercent =
        totalVideos > 0

            ? Number(
                (
                    completedVideos /
                    totalVideos *
                    100
                )
                    .toFixed(
                        1
                    )
            )

            : 0;


    /*
     * Progresso da meta semanal.
     */
    const weeklyGoalPercent =
        weeklyGoal > 0

            ? Number(
                Math.min(
                    (
                        completedWeek /
                        weeklyGoal
                    ) * 100,
                    100
                )
                    .toFixed(
                        1
                    )
            )

            : 0;


    /*
     * Comparação:
     *
     * semana atual
     * -
     * semana anterior
     */
    const difference =
        completedWeek -
        completedPreviousWeek;


    /*
     * Evita divisão por zero
     * quando a semana anterior
     * teve 0 aulas.
     */
    const changePercent =
        completedPreviousWeek > 0

            ? Number(
                (
                    difference /
                    completedPreviousWeek *
                    100
                )
                    .toFixed(
                        1
                    )
            )

            : null;


    let trend =
        'same';


    if (
        difference > 0
    ) {

        trend =
            'up';

    }


    if (
        difference < 0
    ) {

        trend =
            'down';

    }


    return {

        today: {

            completedVideos:
            completedToday

        },


        week: {

            completedVideos:
            completedWeek

        },


        weeklyGoal: {

            target:
            weeklyGoal,

            completed:
            completedWeek,

            remaining:
                Math.max(
                    weeklyGoal -
                    completedWeek,
                    0
                ),

            progressPercent:
            weeklyGoalPercent,

            achieved:
                completedWeek >=
                weeklyGoal

        },


        streak: {

            days:
            streak

        },


        comparison: {

            currentWeek:
            completedWeek,

            previousWeek:
            completedPreviousWeek,

            difference,

            changePercent,

            trend

        },


        library: {

            totalVideos,

            completedVideos,

            progressPercent

        }

    };
}

async function getWeek(
    userId
) {

    const rows =
        await dashboardRepository
            .getWeeklyActivity(
                userId
            );


    return {

        days:
            rows.map(
                (
                    row,
                    index
                ) => ({

                    date:
                    row.day,

                    day:
                        WEEK_DAYS[index],

                    completed:
                    row.completed

                })
            )

    };
}


async function getCalendar(
    userId,
    year,
    month
) {

    const rows =
        await dashboardRepository
            .getMonthlyActivity(
                userId,
                year,
                month
            );


    return {

        year,

        month,

        days:
            rows.map(
                row => ({

                    date:
                    row.day,

                    completed:
                    row.completed

                })
            )

    };
}


async function getContinueStudying(
    userId
) {

    const videos =
        await dashboardRepository
            .getContinueStudying(
                userId,
                5
            );


    return {

        videos:
            videos.map(
                video => ({

                    id:
                        String(
                            video.id
                        ),

                    name:
                    video.name,

                    durationSeconds:
                    video.duration_seconds,

                    currentTimeSeconds:
                    video.current_time_seconds,

                    progressPercent:
                        Number(
                            video.progress_percent
                        )

                })
            )

    };
}


module.exports = {

    getSummary,

    getWeek,

    getCalendar,

    getContinueStudying,

    updateWeeklyGoal
};