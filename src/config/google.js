const {
    google
} =
    require(
        'googleapis'
    );


function getGoogleOAuthClient() {

    const clientId =
        process.env
            .GOOGLE_CLIENT_ID;


    const clientSecret =
        process.env
            .GOOGLE_CLIENT_SECRET;


    const redirectUri =
        process.env
            .GOOGLE_REDIRECT_URI;


    if (
        !clientId ||
        !clientSecret ||
        !redirectUri
    ) {

        throw new Error(
            'Configuração Google OAuth incompleta.'
        );

    }


    return new google.auth.OAuth2(

        clientId,

        clientSecret,

        redirectUri

    );

}


/*
 * Alias para manter compatibilidade
 * com services que usam esse nome.
 */
const createGoogleOAuthClient =
    getGoogleOAuthClient;


module.exports = {

    getGoogleOAuthClient,

    createGoogleOAuthClient

};