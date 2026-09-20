const express = require('express');

const userController =
    require('../controllers/userController');
const authenticate =
    require('../middlewares/authenticate');

const router = express.Router();

router.post(
    '/',
    userController.create
);

router.use(authenticate);

router.get(
    '/',
    userController.findAll
);

router.get(
    '/:id',
    userController.findById
);

router.put(
    '/:id',
    userController.update
);

router.delete(
    '/:id',
    userController.remove
);

module.exports = router;