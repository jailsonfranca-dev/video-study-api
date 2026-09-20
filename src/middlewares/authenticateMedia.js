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
     * Primeiro tentamos o cookie.
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
     * Mantemos suporte ao Bearer
     * para Postman e testes.
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


    return next(
        new AppError(
            'Autenticação necessária para reproduzir o vídeo.',
            401
        )
    );
}


module.exports =
    authenticateMedia;