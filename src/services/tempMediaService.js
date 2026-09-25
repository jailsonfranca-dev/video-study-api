const os =
    require('node:os');

const path =
    require('node:path');

const {
    mkdtemp,
    rm
} =
    require('node:fs/promises');


async function createTempDirectory() {

    const prefix =
        path.join(
            os.tmpdir(),
            'video-study-'
        );


    return mkdtemp(
        prefix
    );
}


async function removeTempDirectory(
    directory
) {

    if (!directory) {
        return;
    }


    await rm(
        directory,
        {
            recursive: true,
            force: true
        }
    );
}


module.exports = {
    createTempDirectory,
    removeTempDirectory
};