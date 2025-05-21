const Booking = require('../models/Booking');
const Concert = require('../models/Concert');


exports.getUserBookingConcert = async (req, res) => {
  try {
    const concerts = await Concert.find().sort({ date: 1 });
    res.render('user/concert', { concerts });
  } catch (err) {
    res.render('error', { error: err.message });
  }
};
exports.bookTickets = async (req, res) => {
  try {
    const { concertId, tickets } = req.body;
    const userId = req.user._id;

    if (!concertId || !tickets || isNaN(tickets) || tickets < 1) {
      req.flash('error', 'Invalid booking request');
      return res.redirect('bookings/index');
    }

    const booking = await Booking.createBooking(concertId, userId, parseInt(tickets));
    req.flash('success', `Successfully booked ${booking.tickets} tickets!`);
    res.redirect('/bookings');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
};



// controllers/bookingController.js
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('concert')
      .sort({ createdAt: -1 });
      console.log(bookings);
      
      

    res.render('bookings/index', { 
      bookings // Passing bookings instead of concerts
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).render('error', {
      message: 'Failed to load your bookings',
      error: err
    });
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