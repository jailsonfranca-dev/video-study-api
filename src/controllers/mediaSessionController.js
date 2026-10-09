const mediaAuthService =
    require(
        '../services/mediaAuthService'
    );


function getMediaCookieOptions() {

    const isProduction =
        process.env.NODE_ENV ===
        'production';


    return {

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

        /*
         * Necessário para o cookie funcionar
         * entre Vercel e Render em navegadores
         * que restringem cookies de terceiros.
         */
        partitioned:
        isProduction

    };

}


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

            'media_token',

            token,

            {

                ...getMediaCookieOptions(),

                maxAge:
                    ttlSeconds * 1000

            }

        );


        return res
            .status(
                200
            )
            .json({
                message:
                    'Sessão de mídia criada com sucesso.'
            });


    } catch (error) {

        next(
            error
        );

    }

}


function remove(
    req,
    res
) {

    res.clearCookie(

        'media_token',

        getMediaCookieOptions()

    );


    return res
        .status(
            204
        )
        .send();

}


module.exports = {

    create,

    remove

};