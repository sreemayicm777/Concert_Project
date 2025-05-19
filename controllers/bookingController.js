// controllers/bookingController.js
const Booking = require('../models/Booking');
const Concert = require('../models/Concert');

// Make sure these functions exist and are exported
exports.bookTickets = async (req, res) => {
  try {
    // Your booking logic here
    const { concertId, tickets } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!concertId || !tickets) {
      throw new Error('Invalid booking request');
    }

    // Rest of your booking logic...
    res.redirect(`/booking/${concertId}`);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    // Your bookings retrieval logic
    const bookings = await Booking.find({ user: req.user._id });
    res.render('bookings/index', { bookings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};