const { google } = require('googleapis');

const {
    createGoogleOAuthClient
} = require('../config/google');

const googleConnectionRepository =
    require('../repositories/googleConnectionRepository');

const {
    decrypt
} = require('../utils/tokenEncryption');

const AppError =
    require('../errors/AppError');


const FOLDER_MIME_TYPE =
    'application/vnd.google-apps.folder';

const fs =
    require('node:fs');

const {
    pipeline
} =
    require('node:stream/promises');


async function createAuthenticatedDriveClient(userId) {

    const connection =
        await googleConnectionRepository
            .findByUserId(userId);

    if (!connection) {
        throw new AppError(
            'Google Drive não está conectado.',
            400
        );
    }

    const refreshToken =
        decrypt(
            connection.refresh_token_encrypted
        );

    const oauth2Client =
        createGoogleOAuthClient();

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    return google.drive({
        version: 'v3',
        auth: oauth2Client
    });
}

function countVideos(node) {

    if (node.type === 'video') {
        return 1;
    }

    if (!node.children) {
        return 0;
    }

    return node.children.reduce(
        (total, child) =>
            total + countVideos(child),
        0
    );
}

function countFolders(node) {

    if (node.type !== 'folder') {
        return 0;
    }

    const children =
        node.children || [];


    return 1 + children.reduce(
        (total, child) =>
            total + countFolders(child),
        0
    );
}


function formatDriveItem(file) {

    return {
        id: file.id,

        name: file.name,

        type:
            file.mimeType === FOLDER_MIME_TYPE
                ? 'folder'
                : 'file',

        mimeType:
        file.mimeType,

        size:
            file.size
                ? Number(file.size)
                : null,

        durationSeconds:
            file.videoMediaMetadata?.durationMillis
                ? Math.round(
                    Number(
                        file.videoMediaMetadata
                            .durationMillis
                    ) / 1000
                )
                : null,

        modifiedTime:
            file.modifiedTime || null
    };
}
async function listChildren(
    drive,
    parentId
) {

    let pageToken = null;

    const items = [];

    do {

        const response =
            await drive.files.list({

                q: `'${parentId}' in parents and trashed = false`,

                spaces: 'drive',

                supportsAllDrives: true,

                includeItemsFromAllDrives: true,

                fields:
                    'nextPageToken,files(id,name,mimeType,size,modifiedTime,parents,driveId,videoMediaMetadata(durationMillis))',

                pageSize: 1000,

                pageToken
            });


        const files =
            response.data.files || [];



        items.push(
            ...files.map(formatDriveItem)
        );


        pageToken =
            response.data.nextPageToken;

    } while (pageToken);


    items.sort((a, b) => {

        if (
            a.type === 'folder' &&
            b.type !== 'folder'
        ) {
            return -1;
        }

        if (
            a.type !== 'folder' &&
            b.type === 'folder'
        ) {
            return 1;
        }

        return a.name.localeCompare(
            b.name,
            'pt-BR'
        );
    });


    return items;
}

//-------------------------------------
async function getVideoMetadata(
    userId,
    fileId
) {

    const drive =
        await createAuthenticatedDriveClient(
            userId
        );

    try {

        const response =
            await drive.files.get({

                fileId,

                supportsAllDrives: true,

                fields:
                    'id,name,mimeType,size,parents,driveId,videoMediaMetadata(durationMillis,width,height)'
            });

        return response.data;

    } catch (error) {

        if (error.code === 404) {

            throw new AppError(
                'Vídeo não encontrado ou a conta Google conectada não possui acesso ao arquivo.',
                404
            );

        }

        throw error;
    }
}
//-------------------------------------------

async function listRootItems(userId) {

    const drive =
        await createAuthenticatedDriveClient(
            userId
        );

    return listChildren(
        drive,
        'root'
    );
}

async function getFolderMetadata(
    drive,
    folderId
) {

    try {

        const response =
            await drive.files.get({

                fileId: folderId,

                supportsAllDrives: true,

                fields:
                    'id,name,mimeType,modifiedTime,parents,driveId'
            });


        const folder =
            response.data;


        if (
            folder.mimeType !==
            FOLDER_MIME_TYPE
        ) {
            throw new AppError(
                'O ID informado não pertence a uma pasta.',
                400
            );
        }


        return {
            id: folder.id,

            name: folder.name,

            type: 'folder',

            mimeType:
            folder.mimeType,

            modifiedTime:
                folder.modifiedTime || null
        };

    } catch (error) {

        if (error instanceof AppError) {
            throw error;
        }

        if (error.code === 404) {
            throw new AppError(
                'Pasta não encontrada no Google Drive.',
                404
            );
        }

        throw error;
    }
}
async function listFolderItems(
    userId,
    folderId
) {

    const drive =
        await createAuthenticatedDriveClient(
            userId
        );


    const folder =
        await getFolderMetadata(
            drive,
            folderId
        );


    const items =
        await listChildren(
            drive,
            folderId
        );


    return {
        folder,
        items
    };
}

async function buildFolderTree(
    drive,
    folderId
) {

    const folder =
        await getFolderMetadata(
            drive,
            folderId
        );


    const items =
        await listChildren(
            drive,
            folderId
        );


    const children = [];


    for (const item of items) {

        /*
         * Se encontramos outra pasta,
         * entramos nela recursivamente.
         */
        if (item.type === 'folder') {

            const childFolder =
                await buildFolderTree(
                    drive,
                    item.id
                );

            children.push(
                childFolder
            );

            continue;
        }


        /*
         * Por enquanto queremos apenas
         * arquivos de vídeo.
         */
        if (
            item.mimeType &&
            item.mimeType.startsWith('video/')
        ) {

            children.push({
                ...item,
                type: 'video'
            });

        }
    }


    return {

        id: folder.id,

        name: folder.name,

        type: 'folder',

        mimeType:
        folder.mimeType,

        modifiedTime:
        folder.modifiedTime,

        children
    };
}

async function getFolderTree(
    userId,
    folderId
) {

    const drive =
        await createAuthenticatedDriveClient(
            userId
        );

    const tree =
        await buildFolderTree(
            drive,
            folderId
        );

    return {
        totalFolders:
            countFolders(tree),
        totalVideos:
            countVideos(tree),

        tree
    };
}

//***************adicionar download******************
async function downloadFileToPath(
    userId,
    fileId,
    destinationPath
) {

    const drive =
        await createAuthenticatedDriveClient(
            userId
        );


    /*
     * Primeiro buscamos metadados.
     */
    const metadataResponse =
        await drive.files.get({

            fileId,

            supportsAllDrives:
                true,

            fields:
                'id,name,mimeType,size,capabilities(canDownload)'
        });


    const file =
        metadataResponse.data;


    if (
        file.capabilities &&
        file.capabilities.canDownload === false
    ) {

        throw new AppError(
            'O Google Drive não permite baixar este arquivo.',
            403
        );

    }


    if (
        !file.mimeType ||
        !file.mimeType.startsWith(
            'video/'
        )
    ) {

        throw new AppError(
            'O arquivo informado não é um vídeo.',
            400
        );

    }


    /*
     * Download real.
     */
    const response =
        await drive.files.get(
            {

                fileId,

                alt:
                    'media',

                supportsAllDrives:
                    true
            },
            {
                responseType:
                    'stream'
            }
        );


    const writeStream =
        fs.createWriteStream(
            destinationPath
        );


    await pipeline(
        response.data,
        writeStream
    );


    return {

        id:
        file.id,

        name:
        file.name,

        mimeType:
        file.mimeType,

        size:
            file.size
                ? Number(
                    file.size
                )
                : null,

        path:
        destinationPath
    };
}
//*************adicionar download********************

module.exports = {
    createAuthenticatedDriveClient,
    listRootItems,
    getFolderTree,
    listFolderItems,
    getVideoMetadata,
    downloadFileToPath
};