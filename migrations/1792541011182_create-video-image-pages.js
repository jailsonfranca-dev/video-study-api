exports.up = (pgm) => {
    pgm.createTable('video_image_pages', {
        id: { type: 'bigserial', primaryKey: true },
        video_id: {
            type: 'bigint', notNull: true,
            references: 'videos(id)', onDelete: 'CASCADE'
        },
        drive_file_id: { type: 'varchar(255)' },
        image_url: { type: 'text', notNull: true },
        position: { type: 'integer', notNull: true },
        created_at: {
            type: 'timestamptz', notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    pgm.addConstraint('video_image_pages', 'uq_video_image_pages_position', {
        unique: ['video_id', 'position']
    });

    // Migra a imagem única existente para a primeira página, sem removê-la
    // da tabela original nem excluir seu arquivo no Google Drive.
    pgm.sql(`
        INSERT INTO video_image_pages
            (video_id, drive_file_id, image_url, position, created_at)
        SELECT video_id, drive_file_id, image_url, 1, created_at
        FROM video_images;
    `);
};

exports.down = (pgm) => {
    // Reversão remove SOMENTE a nova galeria. Não elimina dados da tabela antiga.
    // Atenção: páginas adicionais criadas após a migration serão perdidas no rollback.
    pgm.dropTable('video_image_pages');
};
