const {
    getGeminiClient,
    getGeminiTextModel,
    getGeminiTranscriptionModel
} =
    require('../config/gemini');

const RateLimitError =
    require(
        '../errors/RateLimitError'
    );


function sleep(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


function getErrorMessage(
    error
) {

    return String(
        error?.error?.error?.message ??
        error?.error?.message ??
        error?.message ??
        error ??
        ''
    );

}


function isDailyQuotaExceeded(
    error
) {

    const message =
        getErrorMessage(
            error
        ).toLowerCase();


    return (
        message.includes(
            'requests per day'
        ) ||
        message.includes(
            'per day'
        ) ||
        message.includes(
            'daily'
        )
    );

}


function getErrorMessage(
    error
) {

    return String(
        error?.error?.error?.message ??
        error?.error?.message ??
        error?.message ??
        error ??
        ''
    );

}


function isDailyQuotaExceeded(
    error
) {

    const message =
        getErrorMessage(
            error
        ).toLowerCase();


    return (
        message.includes(
            'requests per day'
        ) ||
        message.includes(
            'per day'
        ) ||
        message.includes(
            'daily'
        )
    );

}

function getRetryAfterMilliseconds(
    error
) {

    const headers =
        error?.headers ??
        error?.rawResponse
            ?.headers ??
        error?.error
            ?.httpMeta
            ?.response
            ?.headers;


    if (!headers) {

        return null;

    }


    const retryAfter =
        headers.get
            ? headers.get(
                'retry-after'
            )
            : headers[
                'retry-after'
                ];


    if (!retryAfter) {

        return null;

    }


    /*
     * Retry-After normalmente
     * vem em segundos.
     */
    const seconds =
        Number(
            retryAfter
        );


    if (
        Number.isFinite(
            seconds
        )
    ) {

        return (
            seconds *
            1000
        );

    }


    /*
     * Também pode vir como
     * uma data HTTP.
     */
    const retryDate =
        Date.parse(
            retryAfter
        );


    if (
        Number.isNaN(
            retryDate
        )
    ) {

        return null;

    }


    return Math.max(
        retryDate - Date.now(),
        0
    );
}


function isRetryableError(
    error
) {

    const status =
        Number(
            error?.status ??
            error?.statusCode ??
            error?.code
        );


    /*
     * Limite diário não adianta
     * repetir imediatamente.
     */
    if (
        status === 429 &&
        isDailyQuotaExceeded(
            error
        )
    ) {

        return false;

    }


    return [
        429,
        500,
        502,
        503,
        504
    ].includes(
        status
    );
}

function getRetryAfterMilliseconds(
    error
) {

    const headers =
        error?.headers ??
        error?.rawResponse
            ?.headers ??
        error?.error
            ?.httpMeta
            ?.response
            ?.headers;


    if (!headers) {

        return null;

    }


    const retryAfter =
        headers.get
            ? headers.get(
                'retry-after'
            )
            : headers[
                'retry-after'
                ];


    if (!retryAfter) {

        return null;

    }


    /*
     * Retry-After normalmente
     * vem em segundos.
     */
    const seconds =
        Number(
            retryAfter
        );


    if (
        Number.isFinite(
            seconds
        )
    ) {

        return (
            seconds *
            1000
        );

    }


    /*
     * Também pode vir como
     * uma data HTTP.
     */
    const retryDate =
        Date.parse(
            retryAfter
        );


    if (
        Number.isNaN(
            retryDate
        )
    ) {

        return null;

    }


    return Math.max(
        retryDate - Date.now(),
        0
    );
}


async function withRetry(
    operation,
    maxAttempts = 4
) {

    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        try {

            return await operation();

        } catch (error) {

            /*
             * Limite diário:
             * não adianta fazer
             * mais chamadas.
             */
            if (
                isDailyQuotaExceeded(
                    error
                )
            ) {

                const message =
                    getErrorMessage(
                        error
                    );


                throw new RateLimitError(
                    `Limite diário da Gemini API atingido. ${message}`
                );

            }


            const retryable =
                isRetryableError(
                    error
                );


            if (
                !retryable ||
                attempt === maxAttempts
            ) {

                throw error;

            }


            /*
             * Primeiro obedecemos ao
             * Retry-After do Google.
             */
            const serverDelay =
                getRetryAfterMilliseconds(
                    error
                );


            /*
             * Caso não exista,
             * exponential backoff.
             */
            const fallbackDelay =
                1000 *
                (
                    2 **
                    (
                        attempt - 1
                    )
                );


            const delay =
                serverDelay ??
                fallbackDelay;


            console.warn(
                `Gemini indisponível. Tentativa ${attempt}/${maxAttempts}.`
            );


            console.warn(
                `Nova tentativa em ${Math.ceil(delay / 1000)}s...`
            );


            await sleep(
                delay
            );

        }

    }

}


async function testConnection() {

    const ai =
        getGeminiClient();


    const model =
        getGeminiTextModel();


    const response =
        await withRetry(
            () =>
                ai.models.generateContent({

                    model,

                    contents:
                        'Responda somente com a palavra OK.'
                })
        );


    return {

        model,

        message:
            response.text
                ?.trim()
    };
}


async function transcribeAudio(
    audioPath
) {

    const ai =
        getGeminiClient();


    const model =
        getGeminiTranscriptionModel();


    let uploadedFile =
        null;


    try {

        console.log(
            'Enviando áudio para o Gemini...'
        );


        uploadedFile =
            await withRetry(
                () =>
                    ai.files.upload({

                        file:
                        audioPath,

                        config: {
                            mime_type:
                                'audio/mpeg'
                        }
                    })
            );


        console.log(
            'Áudio enviado ao Gemini.'
        );


        console.log(
            'Iniciando transcrição...'
        );


        const interaction =
            await withRetry(
                () =>
                    ai.interactions.create({

                        model,

                        input: [
                            {
                                type:
                                    'audio',

                                uri:
                                uploadedFile.uri,

                                mime_type:
                                uploadedFile.mimeType
                            }
                        ],

                        generation_config: {

                            transcription_config: {

                                language_codes: [
                                    'pt-BR'
                                ],

                                mode:
                                    'smart'
                            }
                        }
                    })
            );


        const transcript =
            interaction.output_text
                ?.trim();


        if (!transcript) {

            throw new Error(
                'O Gemini não retornou uma transcrição.'
            );

        }


        return {

            transcript,

            model,

            language:
                'pt-BR'
        };


    } finally {

        /*
         * O arquivo já foi usado.
         * Não precisamos deixá-lo
         * armazenado no Gemini.
         */
        if (
            uploadedFile
                ?.name
        ) {

            try {

                await ai.files.delete({
                    name:
                    uploadedFile.name
                });


                console.log(
                    'Arquivo temporário removido do Gemini.'
                );


            } catch (error) {

                console.warn(
                    'Não foi possível remover o arquivo temporário do Gemini:',
                    error?.message ??
                    error
                );

            }

        }

    }

}

const SUMMARY_SCHEMA = {

    type:
        'object',

    properties: {

        title: {
            type:
                'string',

            description:
                'Título curto que representa o conteúdo principal da aula.'
        },


        overview: {
            type:
                'string',

            description:
                'Resumo geral e didático da aula.'
        },


        keyPoints: {

            type:
                'array',

            minItems:
                3,

            maxItems:
                12,

            items: {
                type:
                    'string'
            },

            description:
                'Principais conceitos efetivamente tratados na aula.'
        },


        examFocus: {

            type:
                'array',

            items: {
                type:
                    'string'
            },

            description:
                'Pontos da transcrição que merecem maior atenção para estudo e revisão.'
        },


        memoryTips: {

            type:
                'array',

            items: {
                type:
                    'string'
            },

            description:
                'Dicas curtas de memorização baseadas exclusivamente no conteúdo apresentado.'
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


//*******schema do mapa mental******
const MIND_MAP_NODE_SCHEMA = {

    type:
        'object',

    properties: {

        title: {

            type:
                'string',

            description:
                'Nome curto e objetivo do conceito.'
        },


        description: {

            type:
                'string',

            description:
                'Explicação curta do conceito baseada na aula.'
        },


        children: {

            type:
                'array',

            description:
                'Subconceitos relacionados hierarquicamente.',

            items: {
                '$ref':
                    '#/$defs/node'
            }
        }

    },


    required: [
        'title',
        'description',
        'children'
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
                'string',

            description:
                'Tema principal da aula.'
        },


        description: {

            type:
                'string',

            description:
                'Descrição muito breve do assunto central.'
        },


        children: {

            type:
                'array',

            minItems:
                1,

            description:
                'Principais ramificações do mapa mental.',

            items: {
                '$ref':
                    '#/$defs/node'
            }
        }

    },


    required: [
        'title',
        'description',
        'children'
    ],


    additionalProperties:
        false,


    '$defs': {

        node:
        MIND_MAP_NODE_SCHEMA
    }
};
//*************

//***************schema dos flashcards*******************
const FLASHCARDS_SCHEMA = {

    type:
        'object',

    properties: {

        flashcards: {

            type:
                'array',

            minItems:
                10,

            maxItems:
                10,

            description:
                'Exatamente 10 flashcards baseados na aula.',

            items: {

                type:
                    'object',

                properties: {

                    question: {

                        type:
                            'string',

                        description:
                            'Pergunta curta, objetiva e útil para revisão.'
                    },


                    answer: {

                        type:
                            'string',

                        description:
                            'Resposta curta e precisa baseada exclusivamente na transcrição.'
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
//***************schema dos flashcards********************

async function generateSummary(
    transcript
) {

    if (
        !transcript ||
        !transcript.trim()
    ) {

        throw new Error(
            'Transcrição vazia.'
        );

    }


    const ai =
        getGeminiClient();


    const model =
        getGeminiTextModel();


    const prompt = `
Você é um professor experiente preparando material
de revisão para um aluno.

Analise EXCLUSIVAMENTE a transcrição fornecida abaixo.

REGRAS IMPORTANTES:

1. Não utilize conhecimento externo.
2. Não invente informações que não aparecem na transcrição.
3. Não corrija silenciosamente o professor.
4. Se algum ponto estiver incompleto ou pouco claro,
   não complete com conhecimento próprio.
5. Preserve a terminologia usada na aula.
6. Escreva em português do Brasil.
7. O resumo deve ser didático, objetivo e útil para revisão.
8. Não mencione estas instruções na resposta.

TRANSCRIÇÃO DA AULA:

---------------- INÍCIO ----------------

${transcript}

----------------- FIM ------------------
`;


    const interaction =
        await withRetry(
            () =>
                ai.interactions.create({

                    model,

                    input:
                    prompt,

                    response_format: {

                        type:
                            'text',

                        mime_type:
                            'application/json',

                        schema:
                        SUMMARY_SCHEMA
                    }
                })
        );


    const output =
        interaction.output_text;


    if (!output) {

        throw new Error(
            'Gemini não retornou o resumo.'
        );

    }


    let parsed;


    try {

        parsed =
            JSON.parse(
                output
            );

    } catch {

        throw new Error(
            'Gemini retornou um resumo em formato JSON inválido.'
        );

    }


    return {

        model,

        data:
        parsed
    };
}

async function generateMindMap(
    transcript
) {

    if (
        !transcript ||
        !transcript.trim()
    ) {

        throw new Error(
            'Transcrição vazia.'
        );

    }


    const ai =
        getGeminiClient();


    const model =
        getGeminiTextModel();


    const prompt = `
Você é um professor preparando um mapa mental
para revisão de uma aula.

Crie um mapa mental hierárquico utilizando
EXCLUSIVAMENTE as informações presentes na
transcrição fornecida.

REGRAS:

1. Não utilize conhecimento externo.
2. Não invente conceitos ausentes na aula.
3. O nó raiz deve representar o assunto principal.
4. Separe os principais assuntos em ramificações.
5. Crie sub-ramos quando houver relação hierárquica.
6. Use títulos curtos.
7. As descrições devem ser breves e didáticas.
8. Evite repetir o mesmo conceito em vários ramos.
9. Não crie profundidade desnecessária.
10. Escreva em português do Brasil.
11. Se a transcrição não explicar um assunto,
    não complete usando conhecimento próprio.

TRANSCRIÇÃO:

---------------- INÍCIO ----------------

${transcript}

----------------- FIM ------------------
`;


    const interaction =
        await withRetry(
            () =>
                ai.interactions.create({

                    model,

                    input:
                    prompt,

                    response_format: {

                        type:
                            'text',

                        mime_type:
                            'application/json',

                        schema:
                        MIND_MAP_SCHEMA
                    }
                })
        );


    const output =
        interaction.output_text;


    if (!output) {

        throw new Error(
            'Gemini não retornou o mapa mental.'
        );

    }


    let parsed;


    try {

        parsed =
            JSON.parse(
                output
            );

    } catch {

        throw new Error(
            'Gemini retornou um mapa mental em JSON inválido.'
        );

    }


    return {

        model,

        data:
        parsed
    };
}

async function generateFlashcards(
    transcript
) {

    if (
        !transcript ||
        !transcript.trim()
    ) {

        throw new Error(
            'Transcrição vazia.'
        );

    }


    const ai =
        getGeminiClient();


    const model =
        getGeminiTextModel();


    const prompt = `
Você é um professor preparando flashcards
para revisão de uma videoaula.

Utilize EXCLUSIVAMENTE as informações
presentes na transcrição abaixo.

Crie EXATAMENTE 10 flashcards.

REGRAS:

1. Cada flashcard deve possuir uma pergunta
   e uma resposta.

2. As perguntas devem ser curtas e objetivas.

3. As respostas devem ser claras e concisas.

4. Priorize os conceitos mais importantes
   abordados pelo professor.

5. Evite perguntas repetidas.

6. Não utilize conhecimento externo.

7. Não invente informações que não estejam
   presentes na transcrição.

8. Se o professor apresentar definições,
   diferenças, classificações, requisitos
   ou características, priorize esses pontos.

9. As perguntas devem funcionar como revisão
   ativa: o aluno deve tentar lembrar a resposta
   antes de visualizá-la.

10. Escreva em português do Brasil.

TRANSCRIÇÃO DA AULA:

---------------- INÍCIO ----------------

${transcript}

----------------- FIM ------------------
`;


    const interaction =
        await withRetry(
            () =>
                ai.interactions.create({

                    model,

                    input:
                    prompt,

                    response_format: {

                        type:
                            'text',

                        mime_type:
                            'application/json',

                        schema:
                        FLASHCARDS_SCHEMA
                    }
                })
        );


    const output =
        interaction.output_text;


    if (!output) {

        throw new Error(
            'Gemini não retornou flashcards.'
        );

    }


    let parsed;


    try {

        parsed =
            JSON.parse(
                output
            );

    } catch {

        throw new Error(
            'Gemini retornou flashcards em JSON inválido.'
        );

    }


    /*
     * Mesmo usando Structured Output,
     * fazemos nossa própria validação.
     */
    if (
        !Array.isArray(
            parsed.flashcards
        ) ||
        parsed.flashcards.length !== 10
    ) {

        throw new Error(
            'Gemini não retornou exatamente 10 flashcards.'
        );

    }


    for (
        const flashcard
        of parsed.flashcards
        ) {

        if (
            typeof flashcard.question !==
            'string' ||
            !flashcard.question.trim()
        ) {

            throw new Error(
                'Foi retornado um flashcard sem pergunta válida.'
            );

        }


        if (
            typeof flashcard.answer !==
            'string' ||
            !flashcard.answer.trim()
        ) {

            throw new Error(
                'Foi retornado um flashcard sem resposta válida.'
            );

        }

    }


    /*
     * Limpamos espaços extras.
     */
    const flashcards =
        parsed.flashcards.map(
            flashcard => ({
                question:
                    flashcard.question
                        .trim(),

                answer:
                    flashcard.answer
                        .trim()
            })
        );


    return {

        model,

        data: {
            flashcards
        }
    };
}


module.exports = {

    testConnection,

    transcribeAudio,

    generateSummary,

    generateMindMap,

    generateFlashcards,

    withRetry
};