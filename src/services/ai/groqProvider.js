const fs =
    require('node:fs');


const {
    stat
} =
    require('node:fs/promises');


const {
    getGroqClient,
    getGroqTextModel,
    getGroqTranscriptionModel
} =
    require(
        '../../config/groq'
    );


const {

    SUMMARY_SCHEMA,

    MIND_MAP_SCHEMA,

    FLASHCARDS_SCHEMA

} =
    require(
        './schemas'
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


function getStatusCode(
    error
) {

    return Number(

        error?.status ??

        error?.statusCode ??

        error?.code

    );
}


function getRetryAfterMilliseconds(
    error
) {

    const headers =
        error?.headers ??
        error?.response?.headers;


    if (!headers) {

        return null;

    }


    let value;


    if (
        typeof headers.get ===
        'function'
    ) {

        value =
            headers.get(
                'retry-after'
            );

    } else {

        value =
            headers[
                'retry-after'
                ];

    }


    if (!value) {

        return null;

    }


    const seconds =
        Number(
            value
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


    return null;
}


function isRetryableError(
    error
) {

    const status =
        getStatusCode(
            error
        );


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


            const serverDelay =
                getRetryAfterMilliseconds(
                    error
                );


            const exponentialDelay =
                1000 *
                (
                    2 **
                    (
                        attempt - 1
                    )
                );


            const delay =
                serverDelay ??
                exponentialDelay;


            console.warn(
                `Groq indisponível. Tentativa ${attempt}/${maxAttempts}.`
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
function getTextModel() {

    return getGroqTextModel();

}

async function testConnection() {

    const groq =
        getGroqClient();


    const model =
        getGroqTextModel();


    const completion =
        await withRetry(
            () =>
                groq.chat
                    .completions
                    .create({

                        model,

                        messages: [

                            {
                                role:
                                    'user',

                                content:
                                    'Responda somente com a palavra OK.'
                            }

                        ],

                        temperature:
                            0
                    })
        );


    const message =
        completion
            .choices?.[0]
            ?.message
            ?.content
            ?.trim();


    if (!message) {

        throw new Error(
            'Groq não retornou resposta.'
        );

    }


    return {

        provider:
            'groq',

        model,

        message
    };
}

async function transcribeAudio(
    audioPath
) {

    const groq =
        getGroqClient();


    const model =
        getGroqTranscriptionModel();


    /*
     * Free Tier da Groq:
     * upload direto até 25 MB.
     */
    const fileStats =
        await stat(
            audioPath
        );


    const maxFileSize =
        25 *
        1024 *
        1024;


    if (
        fileStats.size >
        maxFileSize
    ) {

        const sizeMB =
            (
                fileStats.size /
                1024 /
                1024
            )
                .toFixed(
                    2
                );


        throw new Error(
            `Áudio possui ${sizeMB} MB e ultrapassa o limite de 25 MB do upload gratuito da Groq.`
        );

    }


    console.log(
        'Enviando áudio para Groq Whisper...'
    );


    /*
     * É importante criar o ReadStream
     * DENTRO da função de retry.
     *
     * Assim cada tentativa recebe
     * um novo stream.
     */
    const response =
        await withRetry(
            () =>
                groq.audio
                    .transcriptions
                    .create({

                        file:
                            fs.createReadStream(
                                audioPath
                            ),

                        model,

                        language:
                            'pt',

                        response_format:
                            'json',

                        temperature:
                            0
                    })
        );


    const transcript =
        response
            ?.text
            ?.trim();


    if (!transcript) {

        throw new Error(
            'Groq Whisper não retornou transcrição.'
        );

    }


    console.log(
        'Transcrição Groq concluída.'
    );


    return {

        transcript,

        model,

        language:
            'pt-BR'
    };
}

async function generateStructuredContent({
                                             schemaName,
                                             schema,
                                             systemPrompt,
                                             transcript
                                         }) {

    if (
        !transcript ||
        !transcript.trim()
    ) {

        throw new Error(
            'Transcrição vazia.'
        );

    }


    const groq =
        getGroqClient();


    const model =
        getGroqTextModel();


    const completion =
        await withRetry(
            () =>
                groq.chat
                    .completions
                    .create({

                        model,

                        messages: [

                            {
                                role:
                                    'system',

                                content:
                                systemPrompt
                            },

                            {
                                role:
                                    'user',

                                content:
                                    `TRANSCRIÇÃO DA AULA:\n\n${transcript}`
                            }

                        ],

                        response_format: {

                            type:
                                'json_schema',

                            json_schema: {

                                name:
                                schemaName,

                                strict:
                                    true,

                                schema
                            }
                        },

                        temperature:
                            0.2
                    })
        );


    const content =
        completion
            .choices?.[0]
            ?.message
            ?.content;


    if (!content) {

        throw new Error(
            'Groq não retornou conteúdo.'
        );

    }


    let data;


    try {

        data =
            JSON.parse(
                content
            );

    } catch {

        throw new Error(
            'Groq retornou JSON inválido.'
        );

    }


    return {

        model,

        data
    };
}



async function generateSummary(
    transcript
) {

    return generateStructuredContent({

        schemaName:
            'study_summary',

        schema:
        SUMMARY_SCHEMA,

        systemPrompt: `
Você é um professor experiente preparando
material de revisão para um aluno.

Analise EXCLUSIVAMENTE a transcrição fornecida.

REGRAS:

1. Não utilize conhecimento externo.
2. Não invente informações.
3. Não corrija silenciosamente o professor.
4. Se algo estiver incompleto, não complete
   usando conhecimento próprio.
5. Preserve a terminologia utilizada na aula.
6. Escreva em português do Brasil.
7. O resumo deve ser objetivo e didático.

Retorne:

- title:
  título curto da aula.

- overview:
  resumo geral.

- keyPoints:
  principais pontos abordados.

- examFocus:
  pontos importantes para estudo/revisão.

- memoryTips:
  dicas curtas de memorização baseadas
  somente na transcrição.
`,

        transcript
    });
}
function buildMindMapTree(
    flatMindMap
) {

    const root = {

        title:
        flatMindMap.title,

        description:
        flatMindMap.description,

        children:
            []
    };


    if (
        !Array.isArray(
            flatMindMap.nodes
        )
    ) {

        return root;

    }


    const createdNodes =
        new Map();


    for (
        let index = 0;
        index < flatMindMap.nodes.length;
        index++
    ) {

        const item =
            flatMindMap.nodes[index];


        const node = {

            title:
            item.title,

            description:
            item.description,

            children:
                []
        };


        /*
         * ID interno usado apenas
         * para montar a árvore.
         */
        const id =
            String(
                item.id
            );


        const parentId =
            String(
                item.parentId
            );


        /*
         * Nó de primeiro nível.
         */
        if (
            parentId ===
            '__root__'
        ) {

            root.children.push(
                node
            );

        } else {

            /*
             * O prompt exigirá que
             * pais apareçam antes
             * dos filhos.
             */
            const parent =
                createdNodes.get(
                    parentId
                );


            if (parent) {

                parent.children.push(
                    node
                );

            } else {

                /*
                 * Se a IA cometer um erro
                 * semântico no parentId,
                 * não quebramos todo o mapa.
                 */
                root.children.push(
                    node
                );

            }

        }


        createdNodes.set(
            id,
            node
        );

    }


    return root;
}

async function generateMindMap(
    transcript
) {

    const generated =
        await generateStructuredContent({

            schemaName:
                'study_mind_map',

            schema:
            MIND_MAP_SCHEMA,

            systemPrompt: `
Você é um professor preparando um mapa mental
para revisão de uma videoaula.

Utilize EXCLUSIVAMENTE as informações presentes
na transcrição.

Crie uma estrutura hierárquica em formato de nós.

REGRAS:

1. Não utilize conhecimento externo.

2. Não invente informações.

3. "title" representa o assunto principal da aula.

4. "description" contém uma breve descrição
   do assunto principal.

5. Em "nodes", crie os conceitos e subconceitos
   apresentados na aula.

6. Cada nó precisa possuir:
   - id
   - parentId
   - title
   - description

7. Use IDs simples:
   n1
   n2
   n3
   n4
   ...

8. Para um nó ligado diretamente ao assunto
   principal, use:

   parentId = "__root__"

9. Para um subconceito, use como parentId
   o id do seu nó pai.

Exemplo:

n1
parentId = "__root__"

n2
parentId = "n1"

Isso significa:

Tema principal
    ↓
n1
    ↓
n2

10. IMPORTANTE:
    sempre coloque o nó pai antes de seus filhos
    na lista "nodes".

11. Evite profundidade exagerada.
    Prefira no máximo 3 níveis.

12. Evite repetir conceitos.

13. Use títulos curtos.

14. Use descrições breves e didáticas.

15. Escreva em português do Brasil.
`,

            transcript
        });


    const mindMap =
        buildMindMapTree(
            generated.data
        );


    if (
        mindMap.children.length === 0
    ) {

        throw new Error(
            'Groq retornou um mapa mental sem ramificações.'
        );

    }


    return {

        model:
        generated.model,

        data:
        mindMap
    };
}

async function generateFlashcards(
    transcript
) {

    const generated =
        await generateStructuredContent({

            schemaName:
                'study_flashcards',

            schema:
            FLASHCARDS_SCHEMA,

            systemPrompt: `
Você é um professor preparando flashcards
para revisão de uma aula.

Utilize EXCLUSIVAMENTE a transcrição fornecida.

Crie EXATAMENTE 10 flashcards.

REGRAS:

1. Cada flashcard possui pergunta e resposta.
2. Perguntas curtas e objetivas.
3. Respostas claras e concisas.
4. Priorize conceitos importantes.
5. Evite perguntas repetidas.
6. Não utilize conhecimento externo.
7. Não invente informações.
8. Priorize definições, classificações,
   diferenças, características e requisitos
   apresentados na aula.
9. Os cartões devem funcionar para
   revisão ativa.
10. Escreva em português do Brasil.
`,

            transcript
        });


    const flashcards =
        generated
            .data
            ?.flashcards;


    /*
     * Structured Output garante
     * estrutura.
     *
     * Nossa regra de negócio garante
     * quantidade.
     */
    if (
        !Array.isArray(
            flashcards
        ) ||
        flashcards.length !== 10
    ) {

        throw new Error(
            'Groq não retornou exatamente 10 flashcards.'
        );

    }


    for (
        const flashcard
        of flashcards
        ) {

        if (
            typeof flashcard.question !==
            'string' ||
            !flashcard.question.trim()
        ) {

            throw new Error(
                'Flashcard sem pergunta válida.'
            );

        }


        if (
            typeof flashcard.answer !==
            'string' ||
            !flashcard.answer.trim()
        ) {

            throw new Error(
                'Flashcard sem resposta válida.'
            );

        }


        flashcard.question =
            flashcard.question
                .trim();


        flashcard.answer =
            flashcard.answer
                .trim();

    }


    return generated;
}

module.exports = {

    getTextModel,

    testConnection,

    transcribeAudio,

    generateSummary,

    generateMindMap,

    generateFlashcards,

    withRetry
};