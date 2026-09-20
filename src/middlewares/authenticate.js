const jwt = require('jsonwebtoken');

const AppError =
    require('../errors/AppError');

function authenticate(req, res, next) {

    const authorization =
        req.headers.authorization;

    if (!authorization) {
        return next(
            new AppError(
                'Token de autenticação não informado.',
                401
            )
        );
    }

    const [type, token] =
        authorization.split(' ');

    if (
        type !== 'Bearer' ||
        !token
    ) {
        return next(
            new AppError(
                'Token de autenticação inválido.',
                401
            )
        );
    }

    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET,
                {
                    issuer:
                        process.env.JWT_ISSUER ||
                        'video-study-api'
                }
            );

        req.user = {
            id: decoded.sub,
            email: decoded.email
        };

        next();

    } catch (error) {

        return next(
            new AppError(
                'Token inválido ou expirado.',
                401
            )
        );
    }
}

module.exports = authenticate;