function listToMarkdown(
    items
) {

    if (
        !Array.isArray(
            items
        ) ||
        items.length === 0
    ) {

        return '- Nenhum item identificado.';

    }


    return items
        .map(
            item =>
                `- ${item}`
        )
        .join(
            '\n'
        );
}


function formatSummaryAsMarkdown(
    summary
) {

    return `
# ${summary.title}

${summary.overview}

## Pontos principais

${listToMarkdown(
        summary.keyPoints
    )}

## Pontos importantes para revisão

${listToMarkdown(
        summary.examFocus
    )}

## Dicas de memorização

${listToMarkdown(
        summary.memoryTips
    )}
`.trim();
}


module.exports = {
    formatSummaryAsMarkdown
};