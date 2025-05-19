const express = require('express');
const router = express.Router();
const concertController = require('../controllers/concertController');
const upload = require('../config/multer');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Concert routes
router.get('/', concertController.getAllConcerts);
router.get('/new', isLoggedIn, isAdmin, concertController.getNewForm);
router.post('/', isLoggedIn, isAdmin, upload.single('image'), concertController.createConcert);
router.get('/:id', concertController.getConcert);
router.get('/:id/edit', isLoggedIn, isAdmin, concertController.getEditForm);
router.put('/:id', isLoggedIn, isAdmin, upload.single('image'), concertController.updateConcert);
router.delete('/:id', isLoggedIn, isAdmin, concertController.deleteConcert);

module.exports = router;