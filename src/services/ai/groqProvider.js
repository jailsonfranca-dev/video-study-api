const fs = require('node:fs');
const { stat } = require('node:fs/promises');

const {
    getGroqClient,
    getGroqTextModel,
    getGroqTranscriptionModel
} = require('../../config/groq');

const {
    SUMMARY_SCHEMA,
    MIND_MAP_SCHEMA,
    FLASHCARDS_SCHEMA
} = require('./schemas');

// ============================================================
// Constantes de orçamento de tokens
// ============================================================

const DEFAULT_MAX_COMPLETION_TOKENS = 4096;
const MAX_COMPLETION_TOKENS_LIMIT = 65536;

// [CORREÇÃO] Limite de tokens por minuto do plano gratuito da Groq.
// Ajuste conforme seu plano (ex: 8000 no free tier).
const TPM_LIMIT = Number(process.env.GROQ_TPM_LIMIT) || 8000;

// ============================================================
// Utilitários
// ============================================================

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getStatusCode(error) {
    return Number(
        error?.status ??
        error?.statusCode ??
        error?.code
    );
}

function getRetryAfterMilliseconds(error) {
    const headers = error?.headers ?? error?.response?.headers;
    if (!headers) return null;

    let value;
    if (typeof headers.get === 'function') {
        value = headers.get('retry-after');
    } else {
        value = headers['retry-after'];
    }

    if (!value) return null;

    const seconds = Number(value);
    if (Number.isFinite(seconds)) {
        return seconds * 1000;
    }
    return null;
}

// [CORREÇÃO] Estima o número de tokens de um texto.
// Usa a heurística de 1 token ≈ 4 caracteres (conservador para português).
function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

// [CORREÇÃO] Mínimo de tokens de transcrição que queremos garantir.
const MIN_TRANSCRIPT_TOKENS = 1200;

// [CORREÇÃO] Ajusta a transcrição e o orçamento de saída para caber no TPM,
// garantindo que a transcrição nunca fique vazia.
function fitTranscriptToLimit(systemPrompt, transcript, desiredCompletionTokens, limit) {
    const systemTokens = estimateTokens(systemPrompt);

    // Teto máximo de tokens de saída: nunca pode ultrapassar o TPM menos
    // o prompt do sistema e o mínimo de transcrição.
    const maxOutputBudget = Math.max(
        512,
        limit - systemTokens - MIN_TRANSCRIPT_TOKENS
    );

    const budget = Math.min(desiredCompletionTokens, maxOutputBudget);

    // Espaço disponível para a transcrição
    const availableForTranscript = Math.max(
        MIN_TRANSCRIPT_TOKENS,
        limit - systemTokens - budget
    );

    const transcriptTokens = estimateTokens(transcript);

    if (transcriptTokens <= availableForTranscript) {
        return { transcript, maxCompletionTokens: budget };
    }

    // [CORREÇÃO] Preserva início E fim da transcrição.
    // O início contém a introdução; o fim contém conclusões.
    const charsAllowed = availableForTranscript * 4;
    const halfChars = Math.floor(charsAllowed / 2);

    const head = transcript.slice(0, halfChars);
    const tail = transcript.slice(-halfChars);

    const fittedTranscript =
        `${head}\n\n[...trecho intermediário omitido por limite de tokens...]\n\n${tail}`;

    return {
        transcript: fittedTranscript,
        maxCompletionTokens: budget
    };
}

function isRetryableError(error) {
    const status = getStatusCode(error);
    // [CORREÇÃO] Inclui 413 (rate_limit_exceeded) como retryable
    return [413, 429, 500, 502, 503, 504].includes(status);
}

function isJsonValidationError(error) {
    const status = getStatusCode(error);
    if (status !== 400) return false;
    const message = error?.message ?? error?.error?.message ?? '';
    return message.includes('json_validate_failed');
}

function isTruncationError(error) {
    const message = error?.message ?? '';
    return (
        message.includes('Resposta truncada') ||
        message.includes('finish_reason') ||
        message.includes('max_completion_tokens')
    );
}

// ============================================================
// Retry com orçamento crescente de tokens
// ============================================================

async function withRetry(operation, maxAttempts = 4, initialTokenBudget = DEFAULT_MAX_COMPLETION_TOKENS) {
    let tokenBudget = initialTokenBudget;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation(tokenBudget);
        } catch (error) {
            const retryable = isRetryableError(error);
            const jsonValidation = isJsonValidationError(error);
            const isTruncated = isTruncationError(error);

            const effectiveMax = jsonValidation ? Math.min(maxAttempts, 3) : maxAttempts;

            if (!retryable && !jsonValidation && !isTruncated) {
                throw error;
            }
            if (attempt >= effectiveMax) {
                throw error;
            }

            if (isTruncated) {
                const newBudget = Math.min(tokenBudget * 2, MAX_COMPLETION_TOKENS_LIMIT);
                console.warn(
                    `[Truncamento] Tentativa ${attempt}/${effectiveMax} com ${tokenBudget} tokens. ` +
                    `Aumentando orçamento para ${newBudget} tokens...`
                );
                tokenBudget = newBudget;
            }

            if (jsonValidation && !isTruncated) {
                tokenBudget = Math.min(tokenBudget + 2048, MAX_COMPLETION_TOKENS_LIMIT);
                console.warn(
                    `[json_validate_failed] Tentativa ${attempt}/${effectiveMax}. ` +
                    `Orçamento ajustado para ${tokenBudget} tokens.`
                );
            }

            const serverDelay = getRetryAfterMilliseconds(error);
            const exponentialDelay = 1000 * (2 ** (attempt - 1));
            const delay = serverDelay ?? exponentialDelay;

            console.warn(`Nova tentativa em ${Math.ceil(delay / 1000)}s...`);

            await sleep(delay);
        }
    }
}

// ============================================================
// Funções exportadas
// ============================================================

function getTextModel() {
    return getGroqTextModel();
}

async function testConnection() {
    const groq = getGroqClient();
    const model = getGroqTextModel();

    const completion = await groq.chat.completions.create({
        model,
        messages: [
            { role: 'user', content: 'Responda somente com a palavra OK.' }
        ],
        temperature: 0,
        max_completion_tokens: 2048
    });

    if (completion.choices?.[0]?.finish_reason === 'length') {
        throw new Error('Groq truncou a resposta durante o teste de conexão.');
    }

    const message = completion.choices?.[0]?.message?.content?.trim();
    if (!message) {
        throw new Error('Groq não retornou resposta.');
    }

    return { provider: 'groq', model, message };
}

async function transcribeAudio(audioPath) {
    const groq = getGroqClient();
    const model = getGroqTranscriptionModel();

    const fileStats = await stat(audioPath);
    const maxFileSize = 25 * 1024 * 1024;

    if (fileStats.size > maxFileSize) {
        const sizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
        throw new Error(
            `Áudio possui ${sizeMB} MB e ultrapassa o limite de 25 MB do upload gratuito da Groq.`
        );
    }

    console.log('Enviando áudio para Groq Whisper...');

    const response = await withRetry(() =>
        groq.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model,
            language: 'pt',
            response_format: 'json',
            temperature: 0
        })
    );

    const transcript = response?.text?.trim();
    if (!transcript) {
        throw new Error('Groq Whisper não retornou transcrição.');
    }

    console.log('Transcrição Groq concluída.');

    return { transcript, model, language: 'pt-BR' };
}

async function generateStructuredContent({
                                             schemaName,
                                             schema,
                                             systemPrompt,
                                             transcript,
                                             initialTokenBudget = DEFAULT_MAX_COMPLETION_TOKENS
                                         }) {
    if (!transcript || !transcript.trim()) {
        throw new Error('Transcrição vazia.');
    }

    const groq = getGroqClient();
    const model = getGroqTextModel();

    // [CORREÇÃO] Ajusta a transcrição e o orçamento para caber no TPM.
    const completion = await withRetry(
        (tokenBudget) => {
            const { transcript: fittedTranscript, maxCompletionTokens: fittedBudget } =
                fitTranscriptToLimit(systemPrompt, transcript, tokenBudget, TPM_LIMIT);

            return groq.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `TRANSCRIÇÃO DA AULA:\n\n${fittedTranscript}` }
                ],
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: schemaName,
                        strict: true,
                        schema
                    }
                },
                temperature: 0.2,
                max_completion_tokens: fittedBudget
            });
        },
        4,
        initialTokenBudget
    );

    // ---- Verificar truncamento ----
    const finishReason = completion.choices?.[0]?.finish_reason;
    const content = completion.choices?.[0]?.message?.content;

    if (finishReason === 'length') {
        const tokensUsed = completion.usage?.completion_tokens ?? 'desconhecido';
        console.warn(
            `[${schemaName}] Resposta truncada (finish_reason=length). ` +
            `Tokens gerados: ${tokensUsed}.`
        );
        throw new Error(
            `Resposta truncada durante a geração de ${schemaName}. O JSON está incompleto.`
        );
    }

    if (!content) {
        throw new Error('Groq não retornou conteúdo.');
    }

    let data;
    try {
        data = JSON.parse(content);
    } catch (parseError) {
        const preview = content.length > 300 ? content.substring(0, 300) + '...' : content;
        console.error(
            `[${schemaName}] JSON inválido retornado pela Groq.\n` +
            `Finish reason: ${finishReason}\n` +
            `Tokens usados: ${completion.usage?.completion_tokens ?? '?'}\n` +
            `Trecho: ${preview}`
        );
        throw new Error(
            `Groq retornou JSON inválido para ${schemaName}. Finish reason: ${finishReason}.`
        );
    }

    return { model, data };
}

async function generateSummary(transcript) {
    return generateStructuredContent({
        schemaName: 'study_summary',
        schema: SUMMARY_SCHEMA,
        systemPrompt: `
Você é um professor experiente preparando material de revisão para um aluno.

Analise EXCLUSIVAMENTE a transcrição fornecida.

REGRAS:
1. Não utilize conhecimento externo.
2. Não invente informações.
3. Não corrija silenciosamente o professor.
4. Se algo estiver incompleto, não complete usando conhecimento próprio.
5. Preserve a terminologia utilizada na aula.
6. Escreva em português do Brasil.
7. O resumo deve ser objetivo e didático.

Retorne:
- title: título curto da aula.
- overview: resumo geral.
- keyPoints: principais pontos abordados.
- examFocus: pontos importantes para estudo/revisão.
- memoryTips: dicas curtas de memorização baseadas somente na transcrição.
`,
        transcript
    });
}

function buildMindMapTree(flatMindMap) {
    const root = {
        title: flatMindMap.title,
        description: flatMindMap.description,
        children: []
    };

    if (!Array.isArray(flatMindMap.nodes)) {
        return root;
    }

    const createdNodes = new Map();

    for (let index = 0; index < flatMindMap.nodes.length; index++) {
        const item = flatMindMap.nodes[index];
        const node = {
            title: item.title,
            description: item.description,
            children: []
        };

        const id = String(item.id);
        const parentId = String(item.parentId);

        if (parentId === '__root__') {
            root.children.push(node);
        } else {
            const parent = createdNodes.get(parentId);
            if (parent) {
                parent.children.push(node);
            } else {
                console.warn(
                    `[Mapa Mental] Nó ${id} referencia pai inexistente ${parentId}. ` +
                    'Adicionando ao nível raiz.'
                );
                root.children.push(node);
            }
        }

        createdNodes.set(id, node);
    }

    return root;
}

async function generateMindMap(transcript) {
    // [CORREÇÃO] Não pedir mais do que o TPM permite.
    // Reserva ~1500 tokens para o system prompt e ~1500 para a transcrição.
    const desiredBudget = Math.min(
        3500,
        Math.max(1024, TPM_LIMIT - 3000)
    );

    let lastData = null;

    // [CORREÇÃO] Até 2 tentativas para lidar com resposta vazia do modelo.
    for (let attempt = 1; attempt <= 2; attempt++) {
        const generated = await generateStructuredContent({
            schemaName: 'study_mind_map',
            schema: MIND_MAP_SCHEMA,
            initialTokenBudget: desiredBudget,

            systemPrompt: `
Você é um professor preparando um mapa mental para revisão de uma videoaula.

Utilize EXCLUSIVAMENTE as informações presentes na transcrição.

Crie uma estrutura hierárquica em formato de nós.

REGRAS GERAIS:
1. Não utilize conhecimento externo.
2. Não invente informações.
3. Escreva em português do Brasil.
4. Use títulos curtos (máximo 60 caracteres).
5. Use descrições breves e didáticas (máximo 120 caracteres).
6. Evite repetir conceitos.
7. Prefira no máximo 3 níveis de profundidade.

LIMITES OBRIGATÓRIOS:
- Mínimo de 5 nós e máximo de 20 nós no total.
- Máximo de 7 nós de primeiro nível (parentId = "__root__").
- Máximo de 5 filhos por nó pai.
- Máximo de 4 níveis de profundidade.
- NUNCA retorne "nodes" vazio. Se a transcrição for curta,
  ainda assim extraia os conceitos que conseguir identificar.

ESTRUTURA DO MAPA:
- "title": assunto principal da aula.
- "description": breve descrição do assunto principal.
- "nodes": lista de todos os conceitos e subconceitos (mínimo 5).

CADA NÓ DEVE CONTER:
- id: identificador único (ex: "n1", "n2", "n3"...).
- parentId: id do nó pai. Use "__root__" para nós ligados
  diretamente ao assunto principal.
- title: título do conceito.
- description: breve descrição do conceito.

ORDEM OBRIGATÓRIA:
- Os nós pais DEVEM aparecer ANTES de seus filhos na lista "nodes".
- Exemplo correto de ordem:
  1. n1 (parentId: "__root__")
  2. n2 (parentId: "__root__")
  3. n3 (parentId: "n1")
  4. n4 (parentId: "n1")
  5. n5 (parentId: "n3")

REGRAS ADICIONAIS:
- Sempre coloque o nó pai antes de seus filhos.
- Não crie nós órfãos.
- Não use IDs repetidos.
- RESPEITE os limites de nós.
`,
            transcript
        });

        lastData = generated.data;

        const nodesArray = generated.data?.nodes;

        if (Array.isArray(nodesArray) && nodesArray.length > 0) {
            const mindMap = buildMindMapTree(generated.data);

            if (mindMap.children.length > 0) {
                return {
                    model: generated.model,
                    data: mindMap
                };
            }
        }

        // [CORREÇÃO] Log detalhado para diagnóstico.
        console.warn(
            `[Mapa Mental] Tentativa ${attempt}: modelo retornou ` +
            `nodes com ${Array.isArray(nodesArray) ? nodesArray.length : 'tipo inválido'}. ` +
            `Resposta recebida: ${JSON.stringify(generated.data).substring(0, 400)}...`
        );

        if (attempt < 2) {
            console.warn('[Mapa Mental] Tentando novamente com instrução reforçada...');
            await sleep(1000);
        }
    }

    throw new Error(
        'Groq retornou um mapa mental sem ramificações. ' +
        `Resposta do modelo: ${JSON.stringify(lastData).substring(0, 300)}`
    );
}

async function generateFlashcards(transcript) {
    const generated = await generateStructuredContent({
        schemaName: 'study_flashcards',
        schema: FLASHCARDS_SCHEMA,
        systemPrompt: `
Você é um professor preparando flashcards para revisão de uma aula.

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
8. Priorize definições, classificações, diferenças, características e requisitos apresentados na aula.
9. Os cartões devem funcionar para revisão ativa.
10. Escreva em português do Brasil.
`,
        transcript
    });

    const flashcards = generated.data?.flashcards;

    if (!Array.isArray(flashcards) || flashcards.length !== 10) {
        throw new Error('Groq não retornou exatamente 10 flashcards.');
    }

    for (const flashcard of flashcards) {
        if (
            typeof flashcard.question !== 'string' ||
            !flashcard.question.trim()
        ) {
            throw new Error('Flashcard sem pergunta válida.');
        }
        if (
            typeof flashcard.answer !== 'string' ||
            !flashcard.answer.trim()
        ) {
            throw new Error('Flashcard sem resposta válida.');
        }
        flashcard.question = flashcard.question.trim();
        flashcard.answer = flashcard.answer.trim();
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