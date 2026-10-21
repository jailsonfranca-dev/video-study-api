const { Readable } = require('node:stream');
const { randomUUID } = require('node:crypto');
const AppError = require('../errors/AppError');
const videos = require('../repositories/videoRepository');
const pages = require('../repositories/videoImagePageRepository');
const googleDrive = require('./googleDriveService');

const EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

async function assertVideo(videoId) {
    if (!await videos.findById(videoId)) {
        throw new AppError('Vídeo não encontrado.', 404);
    }
}

function serialize(row) {
    return {
        id: String(row.id),
        videoId: String(row.video_id),
        imageUrl: row.image_url,
        position: row.position,
        createdAt: row.created_at
    };
}

async function list(userId, videoId) {
    await assertVideo(videoId);
    const records = await pages.listByVideoId(videoId);
    return { videoId: String(videoId), pages: records.map(serialize) };
}

async function upload(userId, videoId, buffer, mimeType) {
    await assertVideo(videoId);
    const extension = EXTENSIONS[mimeType];
    if (!extension) throw new AppError('Use imagens JPG, PNG ou WebP.', 400);
    if (!buffer?.length || buffer.length > 5 * 1024 * 1024) {
        throw new AppError('A imagem deve ter entre 1 byte e 5 MB.', 413);
    }

    const drive = await googleDrive.createAuthenticatedDriveClient(userId);
    const folderId = process.env.GOOGLE_DRIVE_STUDY_FOLDER_ID;
    const fileName = `video-${videoId}-pagina-${Date.now()}-${randomUUID()}.${extension}`;
    const response = await drive.files.create({
        requestBody: {
            name: fileName,
            ...(folderId ? { parents: [folderId] } : {})
        },
        media: { mimeType, body: Readable.from(buffer) },
        fields: 'id'
    });

    const driveFileId = response.data.id;
    if (!driveFileId) throw new AppError('O Google Drive não retornou o ID do arquivo.', 502);
    // Não tornamos o arquivo público: a prévia é servida via API autenticada.
    const imageUrl = `https://drive.google.com/file/d/${driveFileId}/view`;

    try {
        const record = await pages.appendPage({ videoId, driveFileId, imageUrl });
        return serialize(record);
    } catch (error) {
        // Evita arquivos órfãos se a gravação no PostgreSQL falhar.
        try { await drive.files.delete({ fileId: driveFileId }); }
        catch (cleanupError) { console.warn('Falha ao limpar upload:', cleanupError.message); }
        throw error;
    }
}

async function getContent(userId, videoId, pageId) {
    await assertVideo(videoId);
    const record = await pages.findByIdAndVideoId(videoId, pageId);
    if (!record) throw new AppError('Página não encontrada nesta aula.', 404);
    if (!record.drive_file_id) throw new AppError('Imagem antiga sem ID do Drive.', 404);

    const drive = await googleDrive.createAuthenticatedDriveClient(userId);
    const metadata = await drive.files.get({
        fileId: record.drive_file_id,
        fields: 'id,mimeType', supportsAllDrives: true
    });
    const mimeType = metadata.data.mimeType;
    if (!EXTENSIONS[mimeType]) throw new AppError('Formato de imagem não suportado.', 415);

    const response = await drive.files.get(
        { fileId: record.drive_file_id, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
    );
    return { stream: response.data, mimeType };
}

async function remove(userId, videoId, pageId) {
    await assertVideo(videoId);
    const record = await pages.findByIdAndVideoId(videoId, pageId);
    if (!record) throw new AppError('Página não encontrada nesta aula.', 404);

    // A primeira página migrada também é referenciada por video_images.
    // Ao removê-la da galeria, não apague o arquivo utilizado pela rota antiga.
    const referencedByLegacy = record.drive_file_id &&
        await pages.isLegacyImage(videoId, record.drive_file_id);
    if (record.drive_file_id && !referencedByLegacy) {
        const drive = await googleDrive.createAuthenticatedDriveClient(userId);
        try {
            await drive.files.delete({ fileId: record.drive_file_id });
        } catch (error) {
            if (error.code !== 404 && error.response?.status !== 404) throw error;
        }
    }
    await pages.deleteByIdAndVideoId(videoId, pageId);
    // A linha legada em video_images permanece intacta de propósito.
    return { message: 'Página removida da galeria.', pageId: String(pageId) };
}

module.exports = { list, upload, getContent, remove };
