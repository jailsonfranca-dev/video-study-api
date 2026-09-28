const jwt =
    require('jsonwebtoken');


const {
    createGoogleOAuthClient
} =
    require('../config/google');


const googleConnectionRepository =
    require(
        '../repositories/googleConnectionRepository'
    );


const userRepository =
    require(
        '../repositories/userRepository'
    );


const {
    encrypt
} =
    require(
        '../utils/tokenEncryption'
    );


const AppError =
    require(
        '../errors/AppError'
    );


const SCOPES = [

    'https://www.googleapis.com/auth/drive.readonly'

];


function generateAuthorizationUrl(
    userId
) {

    const oauth2Client =
        createGoogleOAuthClient();


    const state =
        jwt.sign(
            {
                purpose:
                    'google-oauth'
            },

            process.env
                .GOOGLE_OAUTH_STATE_SECRET,

            {
                subject:
                    String(
                        userId
                    ),

                expiresIn:
                    '10m'
            }
        );


    return oauth2Client
        .generateAuthUrl({

            access_type: 'offline',
            prompt: 'consent',
            scope: SCOPES,
            include_granted_scopes: true,
            state

        });

}


async function handleCallback({

                                  code,

                                  state,

                                  googleError

                              }) {

    if (googleError) {

        throw new AppError(
            'A autorização do Google foi cancelada.',
            400
        );

    }


    if (
        !code ||
        !state
    ) {

        throw new AppError(
            'Resposta OAuth inválida.',
            400
        );

    }


    let decodedState;


    try {

        decodedState =
            jwt.verify(

                state,

                process.env
                    .GOOGLE_OAUTH_STATE_SECRET

            );

    } catch {

        throw new AppError(
            'Estado OAuth inválido ou expirado.',
            400
        );

    }


    if (
        decodedState.purpose !==
        'google-oauth'
    ) {

        throw new AppError(
            'Estado OAuth inválido.',
            400
        );

    }


    const userId =
        decodedState.sub;


    const user =
        await userRepository
            .findById(
                userId
            );


    if (!user) {

        throw new AppError(
            'Usuário não encontrado.',
            404
        );

    }


    const oauth2Client =
        createGoogleOAuthClient();


    let tokens;


    try {

        const response =
            await oauth2Client
                .getToken(
                    code
                );


        tokens =
            response.tokens;


    } catch {

        throw new AppError(
            'Não foi possível concluir a autorização com o Google.',
            400
        );

    }


    /*
     * Não reutilizamos automaticamente
     * o token antigo.
     *
     * Se chegamos aqui para reconectar,
     * queremos um token NOVO.
     */
    if (
        !tokens.refresh_token
    ) {

        throw new AppError(
            'O Google não retornou um novo refresh token. Revogue o acesso anterior e autorize novamente.',
            400
        );

    }


    /*
     * Log seguro.
     *
     * Não mostramos o token.
     */
    console.log(
        'Google OAuth - novo refresh token recebido:',
        Boolean(
            tokens.refresh_token
        )
    );


    const encryptedRefreshToken =
        encrypt(
            tokens.refresh_token
        );


    await googleConnectionRepository
        .upsert({

            userId,

            refreshTokenEncrypted:
            encryptedRefreshToken

        });


    return {

        connected:
            true,

        userId

    };
}


module.exports = {

    generateAuthorizationUrl,

    handleCallback

};