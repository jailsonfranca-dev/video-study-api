const mediaAuthService =
    require('../services/mediaAuthService');


async function create(
    req,
    res,
    next
) {

    try {

        const {
            token,
            ttlSeconds
        } =
            mediaAuthService
                .createMediaToken(
                    req.user.id
                );

        const isProduction =
            process.env.NODE_ENV ===
            'production';


        res.cookie(
            'media_token', // mantenha aqui o nome que seu código já usa
            mediaToken,
            {
                httpOnly:
                    true,

                secure:
                isProduction,

                sameSite:
                    isProduction
                        ? 'none'
                        : 'lax',

                path:
                    '/',

                maxAge:
                    15 * 60 * 1000
            }
        );


        return res
            .status(200)
            .json({
                message:
                    'Sessão de mídia criada com sucesso.'
            });


    } catch (error) {

        next(error);

    }
}


function remove(
    req,
    res
) {

    res.clearCookie(
        'media_session',
        {
            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                'production',

            sameSite:
                'lax',

            path:
                '/'
        }
    );


    return res
        .status(204)
        .send();
}


module.exports = {
    create,
    remove
};