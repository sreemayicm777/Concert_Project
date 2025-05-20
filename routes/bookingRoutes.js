const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isLoggedIn, isUser } = require('../middleware/auth');

// Book tickets
router.post('/', isLoggedIn, isUser, bookingController.bookTickets);

// View user bookings
router.get('/', isLoggedIn, isUser, bookingController.getUserBookingConcert);

// Cancel booking
router.post('/:id/cancel', isLoggedIn, isUser, bookingController.cancelBooking);


// routes/index.js
router.get('/debug', (req, res) => {
  console.log('Session data:', req.session);
  res.json({
    session: req.session,
    user: req.session.user
  });
});
module.exports = router;