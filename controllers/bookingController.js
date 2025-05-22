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
        const { concertId } = req.params;
        const { tickets, paymentMethod } = req.body;
        const userId = req.user._id;
        console.log('Booking request:', { concertId, tickets, paymentMethod, userId });
        // Validation
        if (!concertId || !tickets || isNaN(tickets) || tickets < 1 || !paymentMethod) {
            req.flash('error', 'Invalid booking request');
            return res.redirect('back');
        }

        const booking = await Booking.create({
            concert: concertId,
            user: userId,
            tickets: parseInt(tickets),
            paymentMethod,
            paymentStatus: 'pending' // Set to pending initially
        });

        // Update concert availability
        await Concert.findByIdAndUpdate(concertId, {
            $inc: { availableTickets: -parseInt(tickets) }
        });

        req.flash('success', `Successfully booked ${booking.tickets} tickets!`);
        res.redirect(`/bookings`);
    } catch (err) {
        console.error('Booking error:', err);
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