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


                    folderId:
                        video.folder_id
                            ? String(
                                video.folder_id
                            )
                            : null,


                    folderName:
                        video.folder_name ??
                        null,


                    durationSeconds:
                        video.duration_seconds !==
                        null

                            ? Number(
                                video.duration_seconds
                            )

                            : null,


                    currentTimeSeconds:
                        Number(
                            video.current_time_seconds ??
                            0
                        ),


                    progressPercent:
                        Number(
                            video.progress_percent ??
                            0
                        )

                })
            )

    };
}

async function getRecentActivity(
    userId
) {

    const activities =
        await dashboardRepository
            .getRecentActivity(
                userId,
                8
            );


    return {

        activities:
            (
                activities ??
                []
            )
                .map(
                    activity => ({

                        videoId:
                            String(
                                activity.video_id
                            ),

                        videoName:
                        activity.video_name,


                        folderId:
                            activity.folder_id
                                ? String(
                                    activity.folder_id
                                )
                                : null,


                        folderName:
                            activity.folder_name ??
                            null,


                        durationSeconds:
                            activity.duration_seconds !==
                            null
                                ? Number(
                                    activity.duration_seconds
                                )
                                : null,


                        currentTimeSeconds:
                            Number(
                                activity.current_time_seconds ??
                                0
                            ),


                        progressPercent:
                            Number(
                                activity.percentage ??
                                0
                            ),


                        completed:
                            Boolean(
                                activity.completed
                            ),


                        activityType:
                            activity.completed
                                ? 'completed'
                                : 'watched',


                        lastWatchedAt:
                            activity.last_watched_at ??
                            null,


                        completedAt:
                            activity.completed_at ??
                            null,


                        activityAt:
                            activity.activity_at ??
                            null

                    })
                )

    };
}

async function getStudyTime(
    userId
) {

    const [
        summary,
        weeklyRows
    ] =
        await Promise.all([

            dashboardRepository
                .getStudyTimeSummary(
                    userId
                ),

            dashboardRepository
                .getWeeklyStudyTime(
                    userId
                )

        ]);


    const todaySeconds =
        Number(
            summary?.today_seconds ??
            0
        );


    const weekSeconds =
        Number(
            summary?.week_seconds ??
            0
        );


    const totalSeconds =
        Number(
            summary?.total_seconds ??
            0
        );


    const daysElapsed =
        Math.max(
            Number(
                summary?.days_elapsed ??
                1
            ),
            1
        );


    /*
     * Média da semana atual.
     *
     * Exemplo:
     *
     * segunda + terça = 2 dias
     *
     * 120 minutos estudados
     * ----------------------
     * média = 60 minutos/dia
     */
    const averageDailySeconds =
        Math.round(
            weekSeconds /
            daysElapsed
        );


    const dayNames = {

        1: 'seg',

        2: 'ter',

        3: 'qua',

        4: 'qui',

        5: 'sex',

        6: 'sab',

        7: 'dom'

    };


    const weekDays =
        (
            weeklyRows ??
            []
        )
            .map(
                row => {

                    const dayNumber =
                        Number(
                            row.day_of_week
                        );


                    return {

                        date:
                        row.study_date,

                        day:
                            dayNames[
                                dayNumber
                                ] ??
                            '',

                        seconds:
                            Number(
                                row.seconds ??
                                0
                            )

                    };

                }
            );


    return {

        today: {

            seconds:
            todaySeconds

        },


        week: {

            seconds:
            weekSeconds

        },


        total: {

            seconds:
            totalSeconds

        },


        averageDaily: {

            seconds:
            averageDailySeconds

        },


        bestDay: {

            date:
                summary
                    ?.best_day_date ??
                null,

            seconds:
                Number(
                    summary
                        ?.best_day_seconds ??
                    0
                )

        },


        weekDays

    };

}


module.exports = {

    getSummary,

    getWeek,

    getCalendar,

    getContinueStudying,

    updateWeeklyGoal,

    getRecentActivity,

    getStudyTime
};