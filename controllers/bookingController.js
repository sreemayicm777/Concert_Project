require("dotenv").config();
const Booking = require("../models/Booking");
const Concert = require("../models/Concert");

module.exports = {
  // Get all concerts available for booking
  getUserBookingConcert: async (req, res) => {
    try {
      const concerts = await Concert.find().sort({ date: 1 });
      res.render("user/concert", { concerts });
    } catch (err) {
      res.render("error", { error: err.message });
    }
  },

  // Get a specific concert by ID
  getConcertById: async (req, res) => {
    try {
      const concert = await Concert.findById(req.params.concert_id);
      if (!concert) {
        req.flash("error", "Concert not found");
        return res.redirect("/concerts");
      }
      res.render("bookings/index", { concert });
    } catch (err) {
      req.flash("error", err.message);
      res.redirect("/concerts");
    }
  },

  getBookingById: async (req, res) => {
    try {
      const userId = req.params.user_id;
      const bookings = await Booking.find({user: userId})
      // only concerts name 
       .populate("concert", "name date time venue artist image ticketPrice")
        .populate("user", "username email")
      .sort({ bookedAt: -1 }) 
      ;
      if (!bookings) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
      }
      res.render("user/my-booking", { bookings });
    } catch (err) {
      req.flash("error", err.message);
      res.redirect("/bookings");
    }
  },

 bookTickets: async (req, res) => {
    try {
      const { concertId, username, ticketCount, paymentMethod } = req.body;
      const userId = req.user._id;

      // Validate required fields
      if (!concertId || !username || !ticketCount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      // Check if user already has a booking for this concert
      const existingBooking = await Booking.findOne({
        user: userId,
        concert: concertId,
        status: 'confirmed'
      });

      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: "You already have a booking for this concert",
        });
      }

      // Validate ticket count
      const ticketNum = parseInt(ticketCount);
      if (isNaN(ticketNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket count",
        });
      }

      if (ticketNum > 3) {
        return res.status(400).json({
          success: false,
          message: "Maximum 3 tickets per booking",
        });
      }

      // Get concert and validate
      const concert = await Concert.findById(concertId);
      if (!concert) {
        return res.status(404).json({
          success: false,
          message: "Concert not found",
        });
      }

      if (concert.availableTickets < ticketNum) {
        return res.status(400).json({
          success: false,
          message: "Not enough tickets available",
        });
      }

      // Calculate total price
      const totalPrice = concert.ticketPrice * ticketNum;

      // Create booking with consistent field names
      const booking = await Booking.create({
        concert: concertId,
        user: userId,
        username,
        ticketCount: ticketNum, // Matches schema
        totalPrice, // Matches schema
        paymentMethod,
        bookingDate: new Date(),
        status: "confirmed",
        paymentStatus: "completed",
        concertDetails: {
          name: concert.name,
          artist: concert.artist,
          date: concert.date,
          time: concert.time,
          venue: concert.venue,
          image: concert.image,
        },
      });

      // Update concert availability
      await Concert.findByIdAndUpdate(concertId, {
        $inc: { availableTickets: -ticketNum },
      });

      res.json({
        success: true,
        message: "Booking confirmed - non-refundable",
        booking: booking,
      });
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Booking service temporarily unavailable",
      });
    }
  }, // Book tickets for a concert

  // Cancel a booking
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
            concert.availableTickets += booking.ticketCount;
            await concert.save();

            req.flash('success', 'Booking cancelled successfully');
            res.redirect('/bookings');
        } catch (err) {
            req.flash('error', err.message);
            res.redirect('/bookings');
        }
    },
};
//////////////////
