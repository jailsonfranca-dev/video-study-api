const videoMetadataService =
    require('../services/videoMetadataService');


async function updateDuration(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        const {
            durationSeconds
        } = req.body;


        const video =
            await videoMetadataService
                .updateDuration(
                    id,
                    durationSeconds
                );


        return res
            .status(200)
            .json(video);


    } catch (error) {

        next(error);

    }
}


module.exports = {
    updateDuration
};