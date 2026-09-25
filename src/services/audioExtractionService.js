const {
    spawn
} =
    require('node:child_process');


const ffmpegPath =
    require('ffmpeg-static');


function extractAudio(
    videoPath,
    audioPath
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (!ffmpegPath) {

                reject(
                    new Error(
                        'Executável do FFmpeg não encontrado.'
                    )
                );

                return;
            }


            const args = [

                /*
                 * Sobrescreve saída
                 * caso já exista.
                 */
                '-y',

                /*
                 * Arquivo de entrada.
                 */
                '-i',
                videoPath,

                /*
                 * Ignora o vídeo.
                 */
                '-vn',

                /*
                 * Mono.
                 */
                '-ac',
                '1',

                /*
                 * 16 kHz é suficiente
                 * para voz.
                 */
                '-ar',
                '16000',

                /*
                 * Bitrate pequeno,
                 * adequado para fala.
                 */
                '-b:a',
                '48k',

                /*
                 * Saída.
                 */
                audioPath
            ];


            const process =
                spawn(
                    ffmpegPath,
                    args,
                    {
                        windowsHide:
                            true
                    }
                );


            let errorOutput =
                '';


            process.stderr.on(
                'data',
                chunk => {

                    errorOutput +=
                        chunk.toString();

                }
            );


            process.on(
                'error',
                error => {

                    reject(
                        error
                    );

                }
            );


            process.on(
                'close',
                code => {

                    if (
                        code === 0
                    ) {

                        resolve(
                            audioPath
                        );

                        return;
                    }


                    reject(
                        new Error(
                            `FFmpeg terminou com código ${code}.\n${errorOutput}`
                        )
                    );

                }
            );

        }
    );
}


module.exports = {
    extractAudio
};