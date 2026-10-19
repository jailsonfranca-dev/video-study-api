
require('dotenv').config();

const {
    createGoogleOAuthClient
} = require('../config/google');

const repository = require(
    '../repositories/googleConnectionRepository'
);

const { decrypt } = require(
    '../utils/tokenEncryption'
);

const pool = require('../config/database');

async function main() {
    const userId = process.argv[2];

    if (!/^\d+$/.test(userId || '')) {
        throw new Error('Informe o ID do usuário.');
    }

    const connection = await repository.findByUserId(userId);

    if (!connection) {
        throw new Error('Google Drive não conectado.');
    }

    const client = createGoogleOAuthClient();

    client.setCredentials({
        refresh_token: decrypt(
            connection.refresh_token_encrypted
        )
    });

    const { token } = await client.getAccessToken();
    const info = await client.getTokenInfo(token);

    const scopes = info.scopes || [];

    const canUpload = scopes.some(scope =>
        [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file'
        ].includes(scope)
    );

    console.log('Escopos concedidos:', scopes);
    console.log('Permissão para upload:', canUpload);
}

main()
    .catch(error => {
        console.error('Falha:', error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
