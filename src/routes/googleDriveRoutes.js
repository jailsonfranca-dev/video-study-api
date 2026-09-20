const express = require('express');

const authenticate =
    require('../middlewares/authenticate');

const googleDriveController =
    require('../controllers/googleDriveController');


const router = express.Router();


router.use(authenticate);


router.get(
    '/',
    googleDriveController.listRoot
);


router.get(
    '/folders/:folderId',
    googleDriveController.listFolder
);

router.get(
    '/tree/:folderId',
    googleDriveController.getTree
);

router.post(
    '/sync/:folderId',
    googleDriveController.syncFolder
);

router.get(
    '/videos/:fileId/metadata',
    googleDriveController.getVideoMetadata
);


module.exports = router;