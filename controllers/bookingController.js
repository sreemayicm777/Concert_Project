const Razorpay = require('razorpay');
require('dotenv').config();
const Booking = require('../models/Booking');
const Concert = require('../models/Concert');

module.exports = {
    // Get all concerts available for booking
    getUserBookingConcert: async (req, res) => {
        try {
            const concerts = await Concert.find().sort({ date: 1 });
            res.render('user/concert', { concerts });
        } catch (err) {
            res.render('error', { error: err.message });
        }
    },

    // Get a specific concert by ID
    getConcertById: async (req, res) => {
        try {
            const concert = await Concert.findById(req.params.concert_id);
            if (!concert) {
                req.flash('error', 'Concert not found');
                return res.redirect('/concerts');
            }
            res.render('bookings/index', { concert });
        } catch (err) {
            req.flash('error', err.message);
            res.redirect('/concerts');
        }
    },

    //view all bookings
    getAllBookings: async (req, res) => {
        try {
            const bookings = await Booking.find({ user: req.user._id }).populate('concert');
            res.render('bookings/all', { bookings });
        } catch (err) {
            res.render('error', { error: err.message });
        }
    },
    //view a specific booking by ID
     getBookingById: async (req, res) => {
        try {
            const booking = await Booking.findById(req.params.booking_id)
                .populate('concert')
                .populate('user', 'name email');
            
            if (!booking || booking.user._id.toString() !== req.user._id.toString()) {
                req.flash('error', 'Booking not found or unauthorized access');
                return res.redirect('/bookings');
            }

            console.debug('Booking Details:', {
                id: booking._id,
                concert: booking.concert.name,
                tickets: booking.tickets,
                status: booking.status,
                user: booking.user.email
            });

            res.render('user/my-booking', { 
                booking,
                success: req.flash('success'),
                error: req.flash('error')
            });
        } catch (err) {
            console.error('Error fetching booking:', err);
            req.flash('error', err.message);
            res.redirect('/bookings');
        }
    },

  
    // Book tickets for a concert
    bookTickets: async (req, res) => {
        try {
            const { concertId, tickets ,  paymentMethod } = req.body;
            const userId = req.user._id;
// Validation
            if (!concertId || !tickets || isNaN(tickets) || tickets < 1 || !paymentMethod) {
              
                req.flash('error', 'Invalid booking request');
                return res.redirect('bookings/index');
            }

            const booking = await Booking.createBooking(concertId, userId, parseInt(tickets), paymentMethod);
            res.json({
            success: true,
            booking: {
                _id: booking._id,
                tickets: booking.tickets,
                concert: {
                    _id: booking.concert._id,
                    name: booking.concert.name,
                    date: booking.concert.date,
                    venue: booking.concert.venue,
                    ticketPrice: booking.concert.ticketPrice
                },
                user: booking.user._id
            }
        });
            req.flash('success', `Successfully booked ${booking.tickets} tickets!`);
            res.redirect('/bookings/${booking._id}');
        } catch (err) {
          console.error('Booking error:', err);
        if (req.accepts('json')) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
            req.flash('error', err.message);
            res.redirect('back');
        }
    },

    // Cancel a booking
    cancelBooking: async (req, res) => {
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
    }
};