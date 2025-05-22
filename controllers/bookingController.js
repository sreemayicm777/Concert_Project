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
// Get user's bookings list (NEW)

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
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('concert')
      .sort({ bookedAt: -1 });

    res.render('user/my-bookings', { 
      bookings,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/');
  }
};


// controllers/bookingController.js
exports.getConcertById = async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.concert_id);
    if (!concert) {
      req.flash('error', 'Concert not found');
      return res.redirect('/concerts');
    }
    res.render('bookings/index', { concert }); // Render a different template for single concert view
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/concerts');
  }
}
exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.createBooking(
      req.body.concertId,
      req.user._id,
      parseInt(req.body.tickets)
    );
    
    res.json({ 
      success: true,
      booking: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
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