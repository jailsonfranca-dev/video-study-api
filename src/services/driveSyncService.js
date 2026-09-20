const pool =
    require('../config/database');

const googleDriveService =
    require('./googleDriveService');

const folderRepository =
    require('../repositories/folderRepository');

const videoRepository =
    require('../repositories/videoRepository');

async function syncFolderNode(
    node,
    parentFolderId,
    client,
    stats
) {

    /*
     * Primeiro sincronizamos
     * a própria pasta.
     */
    const savedFolder =
        await folderRepository.upsert(
            {
                driveFolderId: node.id,

                name: node.name,

                parentFolderId
            },
            client
        );


    stats.folders += 1;


    /*
     * Agora percorremos tudo
     * que existe dentro dela.
     */
    for (const child of node.children || []) {

        /*
         * Outra pasta?
         *
         * Entramos recursivamente.
         */
        if (child.type === 'folder') {

            await syncFolderNode(
                child,
                savedFolder.id,
                client,
                stats
            );

            continue;
        }


        /*
         * É vídeo?
         *
         * Salva na tabela videos.
         */
        if (child.type === 'video') {

            await videoRepository.upsert(
                {
                    driveFileId:
                    child.id,

                    name:
                    child.name,

                    mimeType:
                    child.mimeType,

                    durationSeconds:
                        child.durationSeconds ??
                        null,

                    sizeBytes:
                        child.size ?? null,

                    folderId:
                    savedFolder.id
                },
                client
            );


            stats.videos += 1;
        }
    }


    return savedFolder;
}

async function syncDriveFolder(
    userId,
    driveFolderId
) {

    /*
     * Primeiro buscamos toda a árvore
     * no Google Drive.
     *
     * Ainda não começamos a transaction.
     */
    const treeResult =
        await googleDriveService
            .getFolderTree(
                userId,
                driveFolderId
            );


    /*
     * Dependendo da versão que você
     * implementou anteriormente,
     * getFolderTree pode retornar:
     *
     * tree
     *
     * OU
     *
     * {
     *   totalVideos,
     *   totalFolders,
     *   tree
     * }
     */
    const tree =
        treeResult.tree || treeResult;


    const client =
        await pool.connect();


    const stats = {
        folders: 0,
        videos: 0
    };


    try {

        await client.query(
            'BEGIN'
        );


        const rootFolder =
            await syncFolderNode(
                tree,
                null,
                client,
                stats
            );


        await client.query(
            'COMMIT'
        );


        return {
            rootFolder: {
                id:
                rootFolder.id,

                driveFolderId:
                rootFolder
                    .drive_folder_id,

                name:
                rootFolder.name
            },

            synchronized: {
                folders:
                stats.folders,

                videos:
                stats.videos
            }
        };


    } catch (error) {

        await client.query(
            'ROLLBACK'
        );

        throw error;


    } finally {

        client.release();

    }
}

module.exports = {
    syncDriveFolder
};