const AppError =
    require(
        './AppError'
    );


class RateLimitError
    extends AppError {

    constructor(
        message =
            'Limite da IA atingido. Tente novamente mais tarde.'
    ) {

        super(
            message,
            429
        );


        this.name =
            'RateLimitError';

    }

}


module.exports =
    RateLimitError;