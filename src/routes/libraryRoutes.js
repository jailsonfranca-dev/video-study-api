const express = require('express');

const authenticate =
    require('../middlewares/authenticate');

//const validateId = require('../middlewares/validateId');

const videoStreamController = require('../controllers/videoStreamController');
const libraryController = require('../controllers/libraryController');

const videoProgressController = require('../controllers/videoProgressController');

const {updateProgressSchema} = require('../validators/videoProgressValidator');

const validate = require('../middlewares/validate');
const authenticateMedia = require("../middlewares/authenticateMedia");
const videoMetadataController = require('../controllers/videoMetadataController');

const {updateVideoDurationSchema} = require('../validators/videoDurationValidator');
const studyMaterialController = require('../controllers/studyMaterialController');

const router =
    express.Router();

/*
 * STREAM
 *
 * Aceita cookie de mídia
 * ou Bearer Token.
 */
router.get(
    '/videos/:id/stream',
    //validateId,
    authenticateMedia,
    videoStreamController.stream
);

router.get(
    '/videos/:id/stream',
    //validateId,
    authenticateMedia,
    videoStreamController.stream
);


router.patch(
    '/videos/:id/duration',
    //validateId,
    authenticateMedia,
    validate(updateVideoDurationSchema),
    videoMetadataController.updateDuration
);




router.use(authenticate);


router.get(
    '/folders',
    libraryController.listRoot
);


router.get(
    '/folders/:id',
    //validateId,
    libraryController.getFolder
);


router.get(
    '/videos/:id',
    //validateId,
    libraryController.getVideo
);

router.get(
    '/videos/:id/progress',
    //validateId,
    videoProgressController.getProgress
);

router.patch(
    '/videos/:id/progress',
   // validateId,
    validate(updateProgressSchema),
    videoProgressController.updateProgress
);

router.post(
    '/videos/:id/complete',
    //validateId,
    videoProgressController.complete
);

router.delete(
    '/videos/:id/complete',
    //validateId,
    videoProgressController.incomplete
);
router.get(
    '/videos/:id/stream',
    //validateId,
    videoStreamController.stream
);

router.get(
    '/videos/:id/study-material',
    //validateId,
    studyMaterialController.get
);


router.post(
    '/videos/:id/study-material/generate',
    //validateId,
    studyMaterialController.generate
);


router.post(
    '/videos/:id/study-material/summary/regenerate',
    //validateId,
    studyMaterialController
        .regenerateSummary
);


router.post(
    '/videos/:id/study-material/mind-map/regenerate',
    //validateId,
    studyMaterialController
        .regenerateMindMap
);


router.post(
    '/videos/:id/study-material/flashcards/regenerate',
    //validateId,
    studyMaterialController
        .regenerateFlashcards
);


module.exports = router;