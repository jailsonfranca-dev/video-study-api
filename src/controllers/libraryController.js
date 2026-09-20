const libraryService =
    require('../services/libraryService');


async function listRoot(
    req,
    res,
    next
) {

    try {

        const library =
            await libraryService
                .getLibraryRoot();

        return res
            .status(200)
            .json(library);

    } catch (error) {

        next(error);

    }
}


async function getFolder(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        const result =
            await libraryService
                .getFolderContents(
                    id,
                    req.user.id
                );


        return res
            .status(200)
            .json(result);


    } catch (error) {

        next(error);

    }
}

async function getVideo(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        const video =
            await libraryService
                .getVideoById(id);


        return res
            .status(200)
            .json(video);

    } catch (error) {

        next(error);

    }
}


module.exports = {
    listRoot,
    getFolder,
    getVideo
};