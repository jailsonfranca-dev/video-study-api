const jwt =
    require('jsonwebtoken');

const mediaAuthService =
    require('../services/mediaAuthService');

const AppError =
    require('../errors/AppError');


function authenticateMedia(
    req,
    res,
    next
) {

    /*
     * =====================================
     * 1) COOKIE DE MÍDIA (media_session)
     * =====================================
     */
    const mediaToken =
        req.cookies?.media_session;


    if (mediaToken) {

        try {

            const decoded =
                mediaAuthService
                    .verifyMediaToken(
                        mediaToken
                    );


            req.user = {
                id: decoded.sub
            };


            return next();


        } catch (error) {

            return next(
                new AppError(
                    'Sessão de mídia inválida ou expirada.',
                    401
                )
            );

        }

    }


    /*
     * =====================================
     * 2) TOKEN VIA QUERY STRING (?token=)
     * =====================================
     *
     * Usado pela tag <video> em ambientes
     * cross-origin (Vercel -> Render),
     * onde o navegador não envia cookies.
     */
    const queryToken =
        req.query?.token;


    if (queryToken) {

        try {

            const decoded =
                jwt.verify(
                    queryToken,
                    process.env.JWT_SECRET
                );


            req.user = {
                id: decoded.sub
            };


            return next();


        } catch (error) {

            return next(
                new AppError(
                    'Token de vídeo inválido ou expirado.',
                    401
                )
            );

        }

    }


    /*
     * =====================================
     * 3) BEARER (Postman / testes)
     * =====================================
     */
    const authHeader =
        req.headers.authorization;


    if (authHeader) {

        const [
            type,
            token
        ] =
            authHeader.split(' ');


        if (
            type !== 'Bearer' ||
            !token
        ) {

            return next(
                new AppError(
                    'Token inválido.',
                    401
                )
            );

        }


        try {

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );


            req.user = {
                id: decoded.sub
            };


            return next();


        } catch (error) {

            return next(
                new AppError(
                    'Token inválido ou expirado.',
                    401
                )
            );

        }

    }


    /*
     * =====================================
     * NENHUMA AUTENTICAÇÃO VÁLIDA
     * =====================================
     */
    return next(
        new AppError(
            'Autenticação necessária para reproduzir o vídeo.',
            401
        )
    );
}


module.exports =
    authenticateMedia;