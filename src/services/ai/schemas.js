const SUMMARY_SCHEMA = {

    type:
        'object',

    properties: {

        title: {
            type:
                'string'
        },

        overview: {
            type:
                'string'
        },

        keyPoints: {

            type:
                'array',

            items: {
                type:
                    'string'
            }
        },

        examFocus: {

            type:
                'array',

            items: {
                type:
                    'string'
            }
        },

        memoryTips: {

            type:
                'array',

            items: {
                type:
                    'string'
            }
        }

    },

    required: [
        'title',
        'overview',
        'keyPoints',
        'examFocus',
        'memoryTips'
    ],

    additionalProperties:
        false
};


const MIND_MAP_SCHEMA = {

    type:
        'object',

    properties: {

        title: {
            type:
                'string'
        },

        description: {
            type:
                'string'
        },

        nodes: {

            type:
                'array',

            items: {

                type:
                    'object',

                properties: {

                    id: {
                        type:
                            'string'
                    },

                    parentId: {
                        type:
                            'string'
                    },

                    title: {
                        type:
                            'string'
                    },

                    description: {
                        type:
                            'string'
                    }

                },

                required: [
                    'id',
                    'parentId',
                    'title',
                    'description'
                ],

                additionalProperties:
                    false
            }
        }

    },

    required: [
        'title',
        'description',
        'nodes'
    ],

    additionalProperties:
        false
};

const FLASHCARDS_SCHEMA = {

    type:
        'object',

    properties: {

        flashcards: {

            type:
                'array',

            items: {

                type:
                    'object',

                properties: {

                    question: {
                        type:
                            'string'
                    },

                    answer: {
                        type:
                            'string'
                    }

                },

                required: [
                    'question',
                    'answer'
                ],

                additionalProperties:
                    false
            }
        }
    },

    required: [
        'flashcards'
    ],

    additionalProperties:
        false
};


module.exports = {

    SUMMARY_SCHEMA,

    MIND_MAP_SCHEMA,

    FLASHCARDS_SCHEMA
};