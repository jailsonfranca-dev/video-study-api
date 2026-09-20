const express = require('express');

const googleController =
    require('../controllers/googleController');

const authenticate =
    require('../middlewares/authenticate');


const router = express.Router();


router.get(
    '/auth',
    authenticate,
    googleController.getAuthorizationUrl
);


router.get(
    '/callback',
    googleController.callback
);


module.exports = router;