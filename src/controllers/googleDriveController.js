const googleDriveService =
    require('../services/googleDriveService');

const driveSyncService =
    require('../services/driveSyncService');


async function listRoot(
    req,
    res,
    next
) {

    try {

        const items =
            await googleDriveService
                .listRootItems(
                    req.user.id
                );

        return res
            .status(200)
            .json({
                items
            });

    } catch (error) {

        next(error);

    }
}


async function listFolder(
    req,
    res,
    next
) {

    try {

        const {
            folderId
        } = req.params;

        const result =
            await googleDriveService
                .listFolderItems(
                    req.user.id,
                    folderId
                );

        return res
            .status(200)
            .json(result);

    } catch (error) {

        next(error);

    }
}


async function getTree(
    req,
    res,
    next
) {

    try {

        const {
            folderId
        } = req.params;

        const tree =
            await googleDriveService
                .getFolderTree(
                    req.user.id,
                    folderId
                );

        return res
            .status(200)
            .json(tree);

    } catch (error) {

        next(error);

    }
}


async function syncFolder(
    req,
    res,
    next
) {

    try {

        const {
            folderId
        } = req.params;

        const result =
            await driveSyncService
                .syncDriveFolder(
                    req.user.id,
                    folderId
                );

        return res
            .status(200)
            .json({
                message:
                    'Google Drive sincronizado com sucesso.',

                ...result
            });

    } catch (error) {

        next(error);

    }
}


async function getVideoMetadata(
    req,
    res,
    next
) {

    try {

        const {
            fileId
        } = req.params;

        const metadata =
            await googleDriveService
                .getVideoMetadata(
                    req.user.id,
                    fileId
                );

        return res
            .status(200)
            .json(metadata);

    } catch (error) {

        next(error);

    }
}


module.exports = {
    listRoot,
    listFolder,
    getTree,
    syncFolder,
    getVideoMetadata
};