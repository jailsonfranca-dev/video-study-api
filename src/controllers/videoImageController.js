const { pipeline } = require('node:stream/promises');
const videoImageService = require('../services/videoImageService');
const AppError = require('../errors/AppError');

async function uploadImage(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Aceita tanto base64 no JSON quanto arquivo binário caso use multer futuramente
        const imageBase64 = req.body.image || req.body.imageBase64;

        let fileBuffer;
        let mimeType = 'image/jpeg';
        let originalName = 'resumo.jpg';

        if (imageBase64) {
            if (typeof imageBase64 !== 'string') {
                throw new AppError('A imagem deve ser uma string base64.', 400);
            }

            const match = imageBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,/i);

            // Preserva suporte a base64 puro enviado por clientes antigos.
            if (imageBase64.startsWith('data:') && !match) {
                throw new AppError('Formato de imagem inválido. Use JPG, PNG ou WebP.', 400);
            }

            if (match) {
                mimeType = match[1].toLowerCase();
                const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
                originalName = `resumo.${ext}`;
            }

            const base64Clean = match ? imageBase64.slice(match[0].length) : imageBase64;
            fileBuffer = Buffer.from(base64Clean, 'base64');
        } else if (req.file) {
            fileBuffer = req.file.buffer;
            mimeType = req.file.mimetype;
            originalName = req.file.originalname;
        }

        if (!fileBuffer?.length) {
            throw new AppError('Nenhuma imagem válida foi enviada no campo "image".', 400);
        }

        if (fileBuffer.length > 5 * 1024 * 1024) {
            throw new AppError('A imagem deve ter no máximo 5 MB.', 413);
        }

        const result = await videoImageService.uploadImageToDrive(
            userId,
            id,
            fileBuffer,
            originalName,
            mimeType
        );

        return res.status(200).json({
            message: 'Imagem salva com sucesso no Google Drive.',
            ...result
        });
    } catch (error) {
        next(error);
    }
}

async function getImage(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await videoImageService.getVideoImage(userId, id);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

/** GET /library/videos/:id/study-material/image/content */
async function getImageContent(req, res, next) {
    try {
        const { stream, mimeType } = await videoImageService.getVideoImageStream(
            req.user.id,
            req.params.id
        );

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        await pipeline(stream, res);
    } catch (error) {
        // Em caso de falha apos iniciar a resposta binaria, nao envie JSON.
        if (res.headersSent || res.destroyed) {
            return;
        }
        next(error);
    }
}

async function deleteImage(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await videoImageService.deleteVideoImage(userId, id);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    uploadImage,
    getImage,
    getImageContent,
    deleteImage
};