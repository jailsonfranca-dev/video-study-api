const player =
    document.getElementById('player');

const loginButton =
    document.getElementById('loginButton');

const statusElement =
    document.getElementById('status');


let accessToken = null;

let currentVideoId = null;

let videoInfo = null;

let savedProgress = null;

let progressInterval = null;

async function apiFetch(
    url,
    options = {}
) {

    const headers = {
        ...(options.headers || {})
    };


    if (accessToken) {

        headers.Authorization =
            `Bearer ${accessToken}`;

    }


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    if (!response.ok) {

        const data =
            await response
                .json()
                .catch(() => null);


        throw new Error(
            data?.error ||
            `Erro HTTP ${response.status}`
        );

    }


    if (
        response.status === 204
    ) {

        return null;

    }


    return response.json();
}

async function login(
    email,
    password
) {

    const response =
        await fetch(
            '/auth/login',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify({
                        email,
                        password
                    })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.error ||
            'Erro ao realizar login.'
        );

    }


    accessToken =
        data.token;


    return data;
}

async function createMediaSession() {

    await apiFetch(
        '/auth/media-session',
        {
            method: 'POST'
        }
    );

}

async function getVideo(videoId) {

    return apiFetch(
        `/library/videos/${videoId}`
    );

}

async function getProgress(
    videoId
) {

    return apiFetch(
        `/library/videos/${videoId}/progress`
    );

}

async function saveProgress() {

    if (
        !currentVideoId ||
        !accessToken ||
        !Number.isFinite(
            player.currentTime
        )
    ) {

        return;

    }


    const currentTimeSeconds =
        Math.floor(
            player.currentTime
        );


    try {

        const progress =
            await apiFetch(
                `/library/videos/${currentVideoId}/progress`,
                {
                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            currentTimeSeconds
                        })
                }
            );


        statusElement.textContent =
            `Progresso: ${progress.percentage}%` +
            (
                progress.completed
                    ? ' ✅ Assistido'
                    : ''
            );


        console.log(
            'Progresso salvo:',
            progress
        );


    } catch (error) {

        console.error(
            'Erro ao salvar progresso:',
            error
        );

    }
}
function startProgressInterval() {

    if (progressInterval) {

        clearInterval(
            progressInterval
        );

    }


    progressInterval =
        setInterval(
            () => {

                if (
                    !player.paused &&
                    !player.ended
                ) {

                    saveProgress();

                }

            },
            10000
        );
}

function formatTime(seconds) {

    const total =
        Math.floor(seconds);

    const minutes =
        Math.floor(
            total / 60
        );

    const remainingSeconds =
        total % 60;


    return (
        `${minutes}:` +
        String(
            remainingSeconds
        ).padStart(
            2,
            '0'
        )
    );
}

player.addEventListener(
    'pause',
    () => {

        saveProgress();

    }
);

player.addEventListener(
    'ended',
    async () => {

        await saveProgress();

        statusElement.textContent =
            'Vídeo concluído ✅';

    }
);
player.addEventListener(
    'loadedmetadata',
    async () => {

        console.log(
            'Duração do navegador:',
            player.duration
        );


        /*
         * Se o banco ainda não conhece
         * a duração, salva agora.
         */
        if (
            !videoInfo.durationSeconds &&
            Number.isFinite(
                player.duration
            )
        ) {

            const durationSeconds =
                Math.round(
                    player.duration
                );


            await fetch(
                `/library/videos/${currentVideoId}/duration`,
                {
                    method: 'PATCH',

                    credentials:
                        'same-origin',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            durationSeconds
                        })
                }
            );


            videoInfo.durationSeconds =
                durationSeconds;

        }


        /*
         * Retomar da posição salva.
         */
        if (
            savedProgress &&
            savedProgress
                .currentTimeSeconds > 0
        ) {

            let resumeTime =
                savedProgress
                    .currentTimeSeconds;


            /*
             * Evita posicionar exatamente
             * depois do final do vídeo.
             */
            if (
                Number.isFinite(
                    player.duration
                )
            ) {

                resumeTime =
                    Math.min(
                        resumeTime,
                        Math.max(
                            player.duration - 1,
                            0
                        )
                    );

            }


            player.currentTime =
                resumeTime;


            statusElement.textContent =
                `Retomando em ${formatTime(resumeTime)}`;

        }

    }
);

async function loadVideo(
    videoId
) {

    currentVideoId =
        videoId;


    const [
        fetchedVideo,
        fetchedProgress
    ] =
        await Promise.all([

            getVideo(
                videoId
            ),

            getProgress(
                videoId
            )

        ]);


    videoInfo =
        fetchedVideo;

    savedProgress =
        fetchedProgress;


    console.log(
        'Vídeo:',
        videoInfo
    );


    console.log(
        'Progresso:',
        savedProgress
    );


    statusElement.textContent =
        `${videoInfo.name} — ` +
        `${savedProgress.percentage}%`;


    /*
     * Esta URL usa o cookie
     * media_session.
     */
    player.src =
        `/library/videos/${videoId}/stream`;


    player.load();


    startProgressInterval();
}

loginButton.addEventListener(
    'click',
    async () => {

        try {

            const email =
                document
                    .getElementById(
                        'email'
                    )
                    .value;


            const password =
                document
                    .getElementById(
                        'password'
                    )
                    .value;


            const videoId =
                document
                    .getElementById(
                        'videoId'
                    )
                    .value;


            statusElement.textContent =
                'Fazendo login...';


            await login(
                email,
                password
            );


            statusElement.textContent =
                'Criando sessão de mídia...';


            await createMediaSession();


            statusElement.textContent =
                'Carregando vídeo...';


            await loadVideo(
                videoId
            );


        } catch (error) {

            console.error(error);

            statusElement.textContent =
                error.message;

        }

    }
);
window.addEventListener(
    'pagehide',
    () => {

        if (
            !accessToken ||
            !currentVideoId
        ) {

            return;

        }


        const currentTimeSeconds =
            Math.floor(
                player.currentTime || 0
            );


        fetch(
            `/library/videos/${currentVideoId}/progress`,
            {
                method:
                    'PATCH',

                keepalive:
                    true,

                headers: {

                    'Content-Type':
                        'application/json',

                    Authorization:
                        `Bearer ${accessToken}`

                },

                body:
                    JSON.stringify({
                        currentTimeSeconds
                    })
            }
        );

    }
);