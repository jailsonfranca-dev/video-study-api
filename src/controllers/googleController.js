const googleAuthService =
    require('../services/googleAuthService');


async function getAuthorizationUrl(
    req,
    res,
    next
) {

    try {

        const authorizationUrl =
            googleAuthService
                .generateAuthorizationUrl(
                    req.user.id
                );

        return res.status(200).json({
            authorizationUrl
        });

    } catch (error) {
        next(error);
    }
}


async function callback(
    req,
    res,
    next
) {

    try {

        const {
            code,
            state,
            error
        } = req.query;


        const result =
            await googleAuthService
                .handleCallback({
                    code,
                    state,
                    googleError: error
                });


        return res.status(200).json({
            message:
                'Google Drive conectado com sucesso.',

            ...result
        });

    } catch (error) {
        next(error);
    }
}


module.exports = {
    getAuthorizationUrl,
    callback
};