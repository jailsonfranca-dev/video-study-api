const AppError =
    require('../errors/AppError');


function validate(schema) {

    return (req, res, next) => {

        const { error, value } =
            schema.validate(
                req.body,
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );


        if (error) {

            const messages =
                error.details.map(
                    detail =>
                        detail.message
                );

            return next(
                new AppError(
                    messages.join(', '),
                    400
                )
            );

        }


        req.body = value ?? {};

        next();
    };
}


module.exports = validate;