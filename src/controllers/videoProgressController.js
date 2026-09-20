const videoProgressService = require('../services/videoProgressService');

async function getProgress(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        const progress =
            await videoProgressService
                .getProgress(
                    req.user.id,
                    id
                );


        return res
            .status(200)
            .json(progress);


    } catch (error) {

        next(error);

    }
}

async function updateProgress(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        const {
            currentTimeSeconds
        } = req.body || {};


        const progress =
            await videoProgressService
                .updateProgress(
                    req.user.id,
                    id,
                    currentTimeSeconds
                );


        return res
            .status(200)
            .json(progress);


    } catch (error) {

        next(error);

    }
}

async function complete(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        const progress =
            await videoProgressService
                .markAsCompleted(
                    req.user.id,
                    id
                );


        return res
            .status(200)
            .json(progress);


    } catch (error) {

        next(error);

    }
}

async function incomplete(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        const progress =
            await videoProgressService
                .markAsIncomplete(
                    req.user.id,
                    id
                );


        return res
            .status(200)
            .json(progress);


    } catch (error) {

        next(error);

    }
}

module.exports = {
    getProgress,
    updateProgress,
    complete,
    incomplete
};