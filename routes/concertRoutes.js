const express = require('express');
const router = express.Router();
const concertController = require('../controllers/concertController');
const upload = require('../config/multer');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Public Routes

// Get all concerts
router.get('/', concertController.getAllConcerts);

// Get single concert
router.get('/:id', concertController.getConcert);

//     Admin-Protected Routes

// Show new concert form
router.get('/new', isLoggedIn, isAdmin, concertController.getNewForm);

// Create new concert
router.post('/', isLoggedIn, isAdmin, upload.single('image'), concertController.createConcert);

// Show edit form
router.get('/:id/edit', isLoggedIn, isAdmin, concertController.getEditForm);

// Update concert
router.put('/:id', isLoggedIn, isAdmin, upload.single('image'), concertController.updateConcert);

// Delete concert
router.delete('/:id', isLoggedIn, isAdmin, concertController.deleteConcert);

module.exports = router;