function errorHandler(
    error,
    req,
    res,
    next
) {

    console.error(error);

    if (error.isOperational) {
        return res
            .status(error.statusCode)
            .json({
                error: error.message
            });
    }

    if (error.code === '23505') {
        return res
            .status(409)
            .json({
                error: 'Registro duplicado.'
            });
    }

    return res
        .status(500)
        .json({
            error: 'Erro interno do servidor.'
        });
}

module.exports = errorHandler;