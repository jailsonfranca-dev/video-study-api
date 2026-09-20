const Joi = require('joi');

const updateProgressSchema = Joi.object({

    currentTimeSeconds:
        Joi.number()
            .integer()
            .min(0)
            .required()

})
    .required();

module.exports = {
    updateProgressSchema
};