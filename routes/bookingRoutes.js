const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isLoggedIn, isUser } = require('../middleware/auth');



// View user bookings
router.get('/', isLoggedIn, isUser, bookingController.getUserBookingConcert);
router.get('/:concert_id', isLoggedIn, isUser, bookingController.getConcertById);
// Book tickets
router.post('/', isLoggedIn, isUser, bookingController.bookTickets);
// Cancel booking
router.post('/:id/cancel', isLoggedIn, isUser, bookingController.cancelBooking);
router.get('/concerts', isLoggedIn, isUser, bookingController.getUserBookingConcert);

// routes/index.js
router.get('/debug', (req, res) => {
  console.log('Session data:', req.session);
  res.json({
    session: req.session,
    user: req.session.user
  });
});
module.exports = router;