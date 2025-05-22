const Razorpay = require('razorpay');
require('dotenv').config();
const Booking = require('../models/Booking');
const Concert = require('../models/Concert');


// Get all concerts for User
exports.getUserBookingConcert = async (req, res) => {
  try {
    const concerts = await Concert.find().sort({ date: 1 });
    res.render('user/concert', { concerts });
  } catch (err) {
    res.render('error', { error: err.message });
  }
};


// // // controllers/bookingController.js
// exports.getUserBookings = async (req, res) => {
//   try {
//     const bookings = await Booking.find({ user: req.user._id })
//       .populate('concert')
//       .sort({ createdAt: -1 });
//       console.log("bookings", bookings);
      

//     res.render('bookings/index', { 
//       bookings // Passing bookings instead of concerts
//     });
//   } catch (err) {
//     console.error('Error fetching bookings:', err);
//     res.status(500).render('error', {
//       message: 'Failed to load your bookings',
//       error: err
//     });
//   }
// };

// Get Concert By Id

// In your bookingController.js or concertController.js
exports.getConcertById = async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.concert_id);
    if (!concert) {
      req.flash('error', 'Concert not found');
      return res.redirect('/concerts');
    }
    
    res.render('bookings/index', { 
      concert,
      user: req.user,
      razorpayKey: process.env.RAZORPAY_KEY_ID // Make sure this is included
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/concerts');
  }
};


// Initialize with fallback or error handling
let razorpayInstance;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} catch (error) {
  console.error('Payment initialization error:', error.message);
  // Continue running in "payment disabled" mode if in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Running without payment functionality');
    razorpayInstance = {
      orders: {
        create: () => Promise.reject('Payments disabled - missing credentials')
      }
    };
  } else {
    throw error; // Crash in production if credentials missing
  }
}


exports.bookTickets = async (req, res) => {
  try {
    const { concertId, name, email, phone, ticketQuantity, paymentMethod } = req.body;
    const userId = req.user._id;
    console.log('Booking request:', concertId, name, email, phone, ticketQuantity, paymentMethod);
    // Validation checks
    if (!concertId || !name || !email || !phone || !ticketQuantity) {
      req.flash('error', 'Please fill all required fields');
      return res.redirect('back');
    }

    const concert = await Concert.findById(concertId);
    if (!concert) {
      req.flash('error', 'Concert not found');
      return res.redirect('back');
    }

    if (ticketQuantity > concert.availableTickets) {
      req.flash('error', 'Not enough tickets available');
      return res.redirect('back');
    }

    // Create booking
    const booking = await Booking.create({
      concert: concertId,
      user: userId,
      name,
      email,
      phone,
      tickets: ticketQuantity,
      paymentMethod,
      totalAmount: concert.ticketPrice * ticketQuantity,
      status: 'pending'
    });

    // For Razorpay payments
    if (paymentMethod === 'razorpay') {
      const order = await razorpayInstance.orders.create({
        amount: booking.totalAmount * 100,
        currency: 'INR',
        receipt: `booking_${booking._id}`
      });

      return res.render('payment', {
        booking,
        order,
        razorpayKey: process.env.RAZORPAY_KEY_ID
      });
    }

    // For other payment methods
    req.flash('success', 'Booking successful!');
    res.redirect('/bookings');

  } catch (err) {
    console.error('Booking error:', err);
    req.flash('error', err.message);
    res.redirect('back');
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