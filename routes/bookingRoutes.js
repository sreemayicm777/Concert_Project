const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isLoggedIn, isUser } = require('../middleware/auth');

//      Booking Routes

// View all concerts
router.get(
    '/',
    isLoggedIn,
    isUser,
    bookingController.getUserBookingConcert
);

// View specific concert
router.get(
    '/:concert_id',
    isLoggedIn,
    isUser,
    bookingController.getConcertById
);

// Create booking
router.post(
    '/:concertId',
    isLoggedIn,
    isUser,
    bookingController.bookTickets
);

// Cancel booking
router.post(
    '/:id/cancel',
    isLoggedIn,
    isUser,
    bookingController.cancelBooking
);

// View all bookings for logged-in user
router.get('/my-bookings', isLoggedIn, bookingController.getUserBooking);

// View details of a specific booking
router.get('/:id', isLoggedIn, bookingController.getBookingDetails);


// Debug route
router.get('/debug', (req, res) => {
    console.log('Session data:', req.session);
    res.json({
        session: req.session,
        user: req.session.user
    });
});

module.exports = router;