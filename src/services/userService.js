const bcrypt = require('bcryptjs');

const userRepository = require('../repositories/userRepository');
const AppError = require('../errors/AppError');

async function createUser({
                              name,
                              email,
                              password
                          }) {

    if (!name || !email || !password) {
        throw new AppError(
            'Nome, email e senha são obrigatórios.',
            400
        );
    }

    if (password.length < 8) {
        throw new AppError(
            'A senha deve possuir pelo menos 8 caracteres.',
            400
        );
    }

    const normalizedEmail = email
        .trim()
        .toLowerCase();

    const existingUser =
        await userRepository.findByEmail(
            normalizedEmail
        );

    if (existingUser) {
        throw new AppError(
            'Já existe um usuário com este email.',
            409
        );
    }

    const passwordHash =
        await bcrypt.hash(password, 12);

    const user =
        await userRepository.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash
        });

    return user;
}

async function getAllUsers() {
    return userRepository.findAll();
}

async function getUserById(id) {

    const user =
        await userRepository.findById(id);

    if (!user) {
        throw new AppError(
            'Usuário não encontrado.',
            404
        );
    }

    return user;
}

async function updateUser(
    id,
    {
        name,
        email,
        password
    }
) {

    if (!name || !email) {
        throw new AppError(
            'Nome e email são obrigatórios.',
            400
        );
    }

    const existingUser =
        await userRepository.findById(id);

    if (!existingUser) {
        throw new AppError(
            'Usuário não encontrado.',
            404
        );
    }

    const normalizedEmail = email
        .trim()
        .toLowerCase();

    const userWithEmail =
        await userRepository.findByEmail(
            normalizedEmail
        );

    if (
        userWithEmail &&
        userWithEmail.id.toString() !== id.toString()
    ) {
        throw new AppError(
            'Já existe outro usuário com este email.',
            409
        );
    }

    let passwordHash;

    if (password) {

        if (password.length < 8) {
            throw new AppError(
                'A senha deve possuir pelo menos 8 caracteres.',
                400
            );
        }

        passwordHash =
            await bcrypt.hash(password, 12);
    }

    return userRepository.update({
        id,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash
    });
}

async function deleteUser(id) {

    const user =
        await userRepository.findById(id);

    if (!user) {
        throw new AppError(
            'Usuário não encontrado.',
            404
        );
    }

    await userRepository.remove(id);
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};