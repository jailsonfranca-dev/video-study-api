const folderRepository =
    require('../repositories/folderRepository');

const videoRepository =
    require('../repositories/videoRepository');

const AppError =
    require('../errors/AppError');


async function getLibraryRoot() {

    const folders =
        await folderRepository
            .findRootFolders();

    return {
        folders
    };
}


async function getFolderContents(
    folderId,
    userId
) {

    const folder =
        await folderRepository
            .findById(folderId);


    if (!folder) {

        throw new AppError(
            'Pasta não encontrada.',
            404
        );

    }


    const [
        folders,
        videos
    ] = await Promise.all([

        folderRepository
            .findChildren(folderId),

        videoRepository
            .findByFolderIdWithProgress(
                folderId,
                userId
            )

    ]);


    const formattedVideos =
        videos.map(video => ({

            id:
            video.id,

            name:
            video.name,

            mimeType:
            video.mime_type,

            durationSeconds:
            video.duration_seconds,

            sizeBytes:
            video.size_bytes,

            folderId:
            video.folder_id,

            progress: {

                currentTimeSeconds:
                video.current_time_seconds,

                percentage:
                    Number(
                        video.percentage
                    ),

                completed:
                video.completed,

                lastWatchedAt:
                video.last_watched_at

            }

        }));


    return {

        folder: {

            id:
            folder.id,

            name:
            folder.name,

            parentFolderId:
            folder.parent_folder_id

        },

        folders,

        videos:
        formattedVideos
    };
}


async function getVideoById(id) {

    const video =
        await videoRepository
            .findById(id);


    if (!video) {

        throw new AppError(
            'Vídeo não encontrado.',
            404
        );

    }


    return {

        id:
        video.id,

        name:
        video.name,

        mimeType:
        video.mime_type,

        durationSeconds:
        video.duration_seconds,

        sizeBytes:
        video.size_bytes,

        folder: {

            id:
            video.folder_id,

            name:
            video.folder_name

        },

        createdAt:
        video.created_at,

        updatedAt:
        video.updated_at
    };
}


module.exports = {
    getLibraryRoot,
    getFolderContents,
    getVideoById
};