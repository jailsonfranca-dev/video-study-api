const Joi = require('joi');

const createUserSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(120)
        .required(),

    email: Joi.string()
        .trim()
        .email()
        .max(255)
        .required(),

    password: Joi.string()
        .min(6)
        .max(72)
        .required()
});

const updateUserSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(120),

    email: Joi.string()
        .trim()
        .email()
        .max(255),

    password: Joi.string()
        .min(6)
        .max(72)
}).min(1);

module.exports = {
    createUserSchema,
    updateUserSchema
};