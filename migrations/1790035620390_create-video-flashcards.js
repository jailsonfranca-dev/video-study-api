exports.up = (pgm) => {
    // 1. Criação da tabela e colunas
    pgm.createTable('video_flashcards', {
        id: {
            type: 'bigserial',
            primaryKey: true
        },
        study_material_id: {
            type: 'bigint',
            notNull: true
        },
        position: {
            type: 'integer',
            notNull: true
        },
        question: {
            type: 'text',
            notNull: true
        },
        answer: {
            type: 'text',
            notNull: true
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    // 2. Adicionando as Constraints nomeadas

    // Foreign Key
    pgm.addConstraint('video_flashcards', 'fk_video_flashcards_material', {
        foreignKeys: {
            columns: 'study_material_id',
            references: 'video_study_materials(id)',
            onDelete: 'CASCADE'
        }
    });

    // Unique Composta (Múltiplas colunas)
    pgm.addConstraint('video_flashcards', 'uq_video_flashcards_position', {
        unique: ['study_material_id', 'position'] // Passado como um array de strings
    });

    // Check Constraint para a posição
    pgm.addConstraint('video_flashcards', 'ck_video_flashcards_position', {
        check: 'position > 0'
    });
};

exports.down = (pgm) => {
    pgm.dropTable('video_flashcards');
};