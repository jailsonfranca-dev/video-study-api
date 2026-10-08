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
            .GOOGLE_REDIRECT_URI ||
        'http://localhost:3000/google/callback';


    if (
        !clientId ||
        !clientSecret
    ) {

        throw new Error(
            'Credenciais Google OAuth não configuradas.'
        );

    }


    return new google.auth.OAuth2(

        clientId,

        clientSecret,

        redirectUri

    );

}


module.exports = {

    getGoogleOAuthClient

};