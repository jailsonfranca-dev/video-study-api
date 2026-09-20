const express = require('express');

const authController =
    require('../controllers/authController');
const authenticate =
    require('../middlewares/authenticate');


const mediaSessionController =
    require('../controllers/mediaSessionController');

const router = express.Router();

router.post(
    '/login',
    authController.login
);
router.post(
    '/media-session',
    authenticate,
    mediaSessionController.create
);

router.delete(
    '/media-session',
    authenticate,
    mediaSessionController.remove
);

router.get(
    '/me',
    authenticate,
    authController.me
);

module.exports = router;