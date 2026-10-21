const { pipeline } = require('node:stream/promises');
const service = require('../services/videoImagePageService');
const AppError = require('../errors/AppError');

function validateId(value) {
    if (!/^[1-9]\d*$/.test(String(value))) throw new AppError('ID inválido.', 400);
    return value;
}

function parseBase64Image(body) {
    const input = body?.image;
    if (typeof input !== 'string') {
        throw new AppError('Envie JSON com o campo "image" em base64.', 400);
    }
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(input);
    if (!match) throw new AppError('Imagem inválida. Use data URL JPG, PNG ou WebP.', 400);

    const mimeType = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
        throw new AppError('Limite de 5 MB por imagem.', 413);
    }
    const valid = mimeType === 'image/jpeg'
        ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
        : mimeType === 'image/png'
            ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : buffer.subarray(0, 4).toString() === 'RIFF' &&
            buffer.subarray(8, 12).toString() === 'WEBP';
    if (!valid) throw new AppError('O conteúdo não corresponde ao formato da imagem.', 400);
    return { buffer, mimeType };
}

async function list(req, res, next) {
    try {
        res.json(await service.list(req.user.id, validateId(req.params.id)));
    } catch (error) { next(error); }
}

async function upload(req, res, next) {
    try {
        const videoId = validateId(req.params.id);
        const { buffer, mimeType } = parseBase64Image(req.body);
        const page = await service.upload(req.user.id, videoId, buffer, mimeType);
        res.status(201).json({ message: 'Página adicionada.', page });
    } catch (error) { next(error); }
}

async function getContent(req, res, next) {
    try {
        const { stream, mimeType } = await service.getContent(
            req.user.id, validateId(req.params.id), validateId(req.params.pageId)
        );
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        await pipeline(stream, res);
    } catch (error) {
        if (!res.headersSent && !res.destroyed) next(error);
    }
}

async function remove(req, res, next) {
    try {
        res.json(await service.remove(
            req.user.id, validateId(req.params.id), validateId(req.params.pageId)
        ));
    } catch (error) { next(error); }
}

module.exports = { list, upload, getContent, remove };
