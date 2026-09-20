const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepository =
    require('../repositories/userRepository');

const AppError =
    require('../errors/AppError');

async function login({ email, password }) {

    if (!email || !password) {
        throw new AppError(
            'Email e senha são obrigatórios.',
            400
        );
    }

    const normalizedEmail =
        email.trim().toLowerCase();

    const user =
        await userRepository.findByEmail(
            normalizedEmail
        );

    if (!user) {
        throw new AppError(
            'Email ou senha inválidos.',
            401
        );
    }

    const passwordMatches =
        await bcrypt.compare(
            password,
            user.password_hash
        );

    if (!passwordMatches) {
        throw new AppError(
            'Email ou senha inválidos.',
            401
        );
    }

    const token = jwt.sign(
        {
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            subject: user.id.toString(),
            expiresIn:
                process.env.JWT_EXPIRES_IN || '1h',
            issuer:
                process.env.JWT_ISSUER ||
                'video-study-api'
        }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        },
        token
    };
}
async function getAuthenticatedUser(userId) {

    const user =
        await userRepository.findById(userId);

    if (!user) {
        throw new AppError(
            'Usuário não encontrado.',
            404
        );
    }

    return user;
}

module.exports = {
    login,
    getAuthenticatedUser

};