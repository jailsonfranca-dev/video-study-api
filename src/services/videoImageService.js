const { Readable } = require('node:stream');
const googleDriveService = require('./googleDriveService');
const videoImageRepository = require('../repositories/videoImageRepository');
const videoRepository = require('../repositories/videoRepository');
const AppError = require('../errors/AppError');

async function uploadImageToDrive(userId, videoId, fileBuffer, originalName, mimeType) {
    const video = await videoRepository.findById(videoId);
    if (!video) {
        throw new AppError('Vídeo não encontrado.', 404);
    }

    if (!mimeType || !mimeType.startsWith('image/')) {
        throw new AppError('O arquivo enviado deve ser uma imagem válida.', 400);
    }

    // Usa a função padrão existente no seu projeto para criar o client autenticado do Drive
    const drive = await googleDriveService.createAuthenticatedDriveClient(userId);

    const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
    };
    const extension = extensions[mimeType];

    if (!extension) {
        throw new AppError('Formato de imagem inválido. Use JPG, PNG ou WebP.', 400);
    }

    const fileName = `resumo-video-${videoId}-${Date.now()}.${extension}`;

    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    const folderId = process.env.GOOGLE_DRIVE_STUDY_FOLDER_ID;

    const fileMetadata = {
        name: fileName,
        ...(folderId ? { parents: [folderId] } : {})
    };

    const media = {
        mimeType: mimeType,
        body: bufferStream
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
    });

    const fileId = response.data.id;

    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });
    } catch (e) {
        console.warn('Permissão pública ignorada:', e.message);
    }

    const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    const saved = await videoImageRepository.upsert({
        videoId,
        imageUrl,
        driveFileId: fileId
    });

    return {
        videoId: String(saved.video_id),
        imageUrl: saved.image_url,
        updatedAt: saved.updated_at
    };
}

async function getVideoImage(userId, videoId) {
    const video = await videoRepository.findById(videoId);
    if (!video) {
        throw new AppError('Vídeo não encontrado.', 404);
    }

    const record = await videoImageRepository.findByVideoId(videoId);

    return {
        videoId: String(videoId),
        imageUrl: record ? record.image_url : null,
        updatedAt: record ? record.updated_at : null
    };
}

/**
 * Retorna o conteudo binario da imagem vinculada ao video.
 * A requisicao ao Drive usa as credenciais OAuth guardadas no backend;
 * o navegador nunca precisa receber o token Google ou acessar drive.google.com.
 */
async function getVideoImageStream(userId, videoId) {
    const video = await videoRepository.findById(videoId);
    if (!video) {
        throw new AppError('Vídeo não encontrado.', 404);
    }

    const record = await videoImageRepository.findByVideoId(videoId);
    if (!record || !record.drive_file_id) {
        throw new AppError('Nenhuma imagem cadastrada para este vídeo.', 404);
    }

    const drive = await googleDriveService.createAuthenticatedDriveClient(userId);
    const fileId = record.drive_file_id;

    const metadataResponse = await drive.files.get({
        fileId,
        supportsAllDrives: true,
        fields: 'id,mimeType,size'
    });

    const mimeType = metadataResponse.data.mimeType;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        throw new AppError('O arquivo associado não é uma imagem compatível.', 415);
    }

    const fileResponse = await drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
    );

    return { stream: fileResponse.data, mimeType };
}

async function deleteVideoImage(userId, videoId) {
    const video = await videoRepository.findById(videoId);
    if (!video) {
        throw new AppError('Vídeo não encontrado.', 404);
    }

    const record = await videoImageRepository.findByVideoId(videoId);
    if (!record) {
        throw new AppError('Nenhuma imagem cadastrada para este vídeo.', 404);
    }

    if (record.drive_file_id) {
        try {
            const drive = await googleDriveService.createAuthenticatedDriveClient(userId);
            await drive.files.delete({ fileId: record.drive_file_id });
        } catch (error) {
            console.warn('Erro ao deletar do Drive:', error.message);
        }
    }

    const pool = require('../config/database');
    await pool.query('DELETE FROM video_images WHERE video_id = $1', [videoId]);

    return { message: 'Imagem removida com sucesso.' };
}

module.exports = {
    uploadImageToDrive,
    getVideoImage,
    getVideoImageStream,
    deleteVideoImage
};