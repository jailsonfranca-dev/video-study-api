const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
    const key = Buffer.from(
        process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
        'hex'
    );

    if (key.length !== 32) {
        throw new Error(
            'GOOGLE_TOKEN_ENCRYPTION_KEY deve possuir 32 bytes.'
        );
    }

    return key;
}


function encrypt(text) {

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        ALGORITHM,
        getKey(),
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex')
    ].join(':');
}


function decrypt(payload) {

    const [
        ivHex,
        authTagHex,
        encryptedHex
    ] = payload.split(':');

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        getKey(),
        Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(
        Buffer.from(authTagHex, 'hex')
    );

    const decrypted = Buffer.concat([
        decipher.update(
            Buffer.from(encryptedHex, 'hex')
        ),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
}


module.exports = {
    encrypt,
    decrypt
};