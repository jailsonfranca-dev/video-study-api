const jwt = require('jsonwebtoken');

const {
    createGoogleOAuthClient
} = require('../config/google');

const googleConnectionRepository =
    require('../repositories/googleConnectionRepository');

const userRepository =
    require('../repositories/userRepository');

const {
    encrypt
} = require('../utils/tokenEncryption');

const AppError =
    require('../errors/AppError');


const SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly'
];
function generateAuthorizationUrl(userId) {

    const oauth2Client =
        createGoogleOAuthClient();


    const state = jwt.sign(
        {
            purpose: 'google-oauth'
        },
        process.env.GOOGLE_OAUTH_STATE_SECRET,
        {
            subject: String(userId),
            expiresIn: '10m'
        }
    );


    return oauth2Client.generateAuthUrl({

        access_type: 'offline',

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


    if (!code || !state) {
        throw new AppError(
            'Resposta OAuth inválida.',
            400
        );
    }


    let decodedState;

    try {

        decodedState = jwt.verify(
            state,
            process.env.GOOGLE_OAUTH_STATE_SECRET
        );

    } catch (error) {

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


    const userId = decodedState.sub;


    const user =
        await userRepository.findById(userId);

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
            await oauth2Client.getToken(code);

        tokens = response.tokens;

    } catch (error) {

        throw new AppError(
            'Não foi possível concluir a autorização com o Google.',
            400
        );
    }


    if (!tokens.refresh_token) {

        const existingConnection =
            await googleConnectionRepository
                .findByUserId(userId);

        if (existingConnection) {

            return {
                connected: true,
                userId,
                reusedRefreshToken: true
            };
        }

        throw new AppError(
            'O Google não retornou um refresh token. Autorize a conta novamente.',
            400
        );
    }


    const encryptedRefreshToken =
        encrypt(tokens.refresh_token);


    await googleConnectionRepository.upsert({
        userId,
        refreshTokenEncrypted:
        encryptedRefreshToken
    });


    return {
        connected: true,
        userId
    };
}

module.exports = {
    generateAuthorizationUrl,
    handleCallback
};