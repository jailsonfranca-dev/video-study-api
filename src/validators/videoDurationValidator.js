const Joi = require('joi');

const updateVideoDurationSchema =
    Joi.object({

        durationSeconds:
            Joi.number()
                .integer()
                .min(1)
                .required()

    })
        .required();

module.exports = {
    updateVideoDurationSchema
};