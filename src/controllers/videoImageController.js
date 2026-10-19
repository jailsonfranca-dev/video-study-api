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
            const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            fileBuffer = Buffer.from(base64Clean, 'base64');
        } else if (req.file) {
            fileBuffer = req.file.buffer;
            mimeType = req.file.mimetype;
            originalName = req.file.originalname;
        }

        if (!fileBuffer) {
            throw new AppError('Nenhuma imagem foi enviada no corpo da requisição (esperado campo "image" em JSON base64).', 400);
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
    deleteImage
};