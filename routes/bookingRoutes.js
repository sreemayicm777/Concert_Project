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
    '/book/:concertId',
    isLoggedIn,
    isUser,
    bookingController.bookTickets
);

// View all bookings
router.get(
    '/my-bookings',
    isLoggedIn,
    isUser,
    bookingController.getAllBookings
);

// View specific booking
router.get(
    '/my-bookings/:user_id',
    isLoggedIn,
    isUser,
    bookingController.getBookingById
);

// Cancel booking
router.post(
    '/:id/cancel',
    isLoggedIn,
    isUser,
    bookingController.cancelBooking
);

// Debug route
router.get('/debug', (req, res) => {
    console.log('Session data:', req.session);
    res.json({
        session: req.session,
        user: req.session.user
    });
});

module.exports = router;