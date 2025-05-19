// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();

// Debugging - check what we're importing
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

console.log('Checking imports:');
console.log('bookTickets exists?', typeof bookingController.bookTickets);
console.log('getUserBookings exists?', typeof bookingController.getUserBookings);
console.log('isLoggedIn exists?', typeof authMiddleware.isLoggedIn);
console.log('isUser exists?', typeof authMiddleware.isUser);

// Define routes only if all required functions exist
if (typeof bookingController.bookTickets === 'function' &&
    typeof authMiddleware.isLoggedIn === 'function' &&
    typeof authMiddleware.isUser === 'function') {
  router.post('/', authMiddleware.isLoggedIn, authMiddleware.isUser, bookingController.bookTickets);
  router.get('/my-bookings', authMiddleware.isLoggedIn, authMiddleware.isUser, bookingController.getUserBookings);
} else {
  console.error('Missing required functions for booking routes!');
}

module.exports = router;