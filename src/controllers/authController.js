const authService =
    require('../services/authService');

async function login(req, res, next) {

    try {

        const result =
            await authService.login(req.body);

        return res
            .status(200)
            .json(result);

    } catch (error) {

        next(error);
    }
}

async function me(req, res, next) {

    try {

        const user =
            await authService
                .getAuthenticatedUser(
                    req.user.id
                );

        return res
            .status(200)
            .json(user);

    } catch (error) {

        next(error);
    }
}

module.exports = {
    login,
    me
};