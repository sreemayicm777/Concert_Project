const Booking = require('../models/Booking');
const Concert = require('../models/Concert');

exports.bookTickets = async (req, res) => {
  try {
    const { concertId, tickets } = req.body;
    const userId = req.user._id;

    if (!concertId || !tickets || isNaN(tickets) || tickets < 1) {
      req.flash('error', 'Invalid booking request');
      return res.redirect('back');
    }

    const booking = await Booking.createBooking(concertId, userId, parseInt(tickets));
    req.flash('success', `Successfully booked ${booking.tickets} tickets!`);
    res.redirect('/bookings');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
};


exports.getUserBookingConcert = async (req, res) => {
  try {
    const concerts = await Concert.find().sort({ date: 1 });
    res.render('user/concert', { concerts });
  } catch (err) {
    res.render('error', { error: err.message });
  }
};
// controllers/bookingController.js
exports.getUserBookings = async (req, res) => {
  try {
    // Add debug logging
    console.log('Current user:', req.user);
    
    if (!req.user || !req.user._id) {
      throw new Error('User not authenticated');
    }

    const bookings = await Booking.find({ user: req.user._id })
      .populate('concert')
      .sort({ bookedAt: -1 });

    res.render('bookings/index', { 
      bookings,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    console.error('Booking error:', err);
    req.flash('error', 'Failed to load bookings: ' + err.message);
    res.redirect('/');
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('concert');
    
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      throw new Error('Booking not found');
    }

    booking.status = 'cancelled';
    await booking.save();

    // Return tickets to concert availability
    const concert = booking.concert;
    concert.availableTickets += booking.tickets;
    await concert.save();

    req.flash('success', 'Booking cancelled successfully');
    res.redirect('/bookings');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/bookings');
  }
};