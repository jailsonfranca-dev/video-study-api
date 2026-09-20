const userService =
    require('../services/userService');

async function create(req, res, next) {
    try {

        const user =
            await userService.createUser(
                req.body
            );

        return res
            .status(201)
            .json(user);

    } catch (error) {
        next(error);
    }
}

async function findAll(req, res, next) {
    try {

        const users =
            await userService.getAllUsers();

        return res
            .status(200)
            .json(users);

    } catch (error) {
        next(error);
    }
}

async function findById(req, res, next) {
    try {

        const { id } = req.params;

        const user =
            await userService.getUserById(id);

        return res
            .status(200)
            .json(user);

    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {

        const { id } = req.params;

        const user =
            await userService.updateUser(
                id,
                req.body
            );

        return res
            .status(200)
            .json(user);

    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {

        const { id } = req.params;

        await userService.deleteUser(id);

        return res
            .status(204)
            .send();

    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};