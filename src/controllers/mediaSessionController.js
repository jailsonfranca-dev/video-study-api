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


        res.cookie(
            'media_session',
            token,
            {
                httpOnly: true,

                secure:
                    process.env.NODE_ENV ===
                    'production',

                sameSite:
                    'lax',

                path:
                    '/library/videos',

                maxAge:
                    ttlSeconds * 1000
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
                '/library/videos'
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