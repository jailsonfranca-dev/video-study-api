exports.up = (pgm) => {
    // 1. Criação da tabela e colunas
    pgm.createTable('video_study_materials', {
        id: {
            type: 'bigserial',
            primaryKey: true
        },
        video_id: {
            type: 'bigint',
            notNull: true
        },
        summary: {
            type: 'text'
        },
        mind_map: {
            type: 'jsonb'
        },
        generation_model: {
            type: 'varchar(100)'
        },
        status: {
            type: 'varchar(30)',
            notNull: true,
            default: 'pending' // Equivalente ao DEFAULT 'pending' do SQL
        },
        error_message: {
            type: 'text'
        },
        generated_at: {
            type: 'timestamptz'
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
    pgm.addConstraint('video_study_materials', 'fk_video_study_materials_video', {
        foreignKeys: {
            columns: 'video_id',
            references: 'videos(id)',
            onDelete: 'CASCADE'
        }
    });

    // Unique
    pgm.addConstraint('video_study_materials', 'uq_video_study_materials_video', {
        unique: ['video_id']
    });

    // Check Constraint para o status
    pgm.addConstraint('video_study_materials', 'ck_video_study_materials_status', {
        check: "status IN ('pending', 'processing', 'completed', 'failed')"
    });
};

exports.down = (pgm) => {
    pgm.dropTable('video_study_materials');
};