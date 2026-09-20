const jwt = require('jsonwebtoken');


function createMediaToken(userId) {

    const ttlSeconds =
        Number(
            process.env.MEDIA_TOKEN_TTL_SECONDS ||
            7200
        );


    const token =
        jwt.sign(
            {
                purpose:
                    'media-stream'
            },

            process.env.MEDIA_TOKEN_SECRET,

            {
                subject:
                    String(userId),

                expiresIn:
                ttlSeconds
            }
        );


    return {
        token,
        ttlSeconds
    };
}


function verifyMediaToken(token) {

    const decoded =
        jwt.verify(
            token,
            process.env.MEDIA_TOKEN_SECRET
        );


    if (
        decoded.purpose !==
        'media-stream'
    ) {

        throw new Error(
            'Token de mídia inválido.'
        );

    }


    return decoded;
}


module.exports = {
    createMediaToken,
    verifyMediaToken
};