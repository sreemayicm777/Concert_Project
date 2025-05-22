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

  //view all bookings
  getAllBookings: async (req, res) => {
    try {
      const bookings = await Booking.find({ user: req.user._id }).populate(
        "concert"
      );
      res.render("bookings/all", { bookings });
    } catch (err) {
      res.render("error", { error: err.message });
    }
  },
  //view a specific booking by specific user
  getBookingById: async (req, res) => {
    try {
      const userId = req.params.user_id;
      const booking = await Booking.find({user: userId})
      // only concerts name 
      .populate("concert", "name")
      .populate("user", "name email phone")
      .sort({ bookingDate: -1 }) 
      ;

      console.log("Booking ID:", booking);
      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
      }
      res.render("user/my-booking", { booking });
    } catch (err) {
      req.flash("error", err.message);
      res.redirect("/bookings");
    }
  },

  // Book tickets for a concert
  bookTickets: async (req, res) => {
    try {
      const { concertId, name, email, phone, ticketQuantity, paymentMethod } =
        req.body;
      const userId = req.user._id;
      console.log(
        "Booking request:",
        concertId,
        name,
        email,
        phone,
        ticketQuantity,
        paymentMethod
      );
      // Validation checks
      if (!concertId || !name || !email || !phone || !ticketQuantity) {
        req.flash("error", "Please fill all required fields");
        return res.redirect("back");
      }

      const concert = await Concert.findById(concertId);
      if (!concert) {
        req.flash("error", "Concert not found");
        return res.redirect("back");
      }

      if (ticketQuantity > concert.availableTickets) {
        req.flash("error", "Not enough tickets available");
        return res.redirect("back");
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
        status: "pending",
      });

      // Deduct tickets from concert availability
      concert.availableTickets -= ticketQuantity;
      await concert.save();

      // For other payment methods
      req.flash("success", "Booking successful!");
      res.redirect("/bookings");
    } catch (err) {
      console.error("Booking error:", err);
      req.flash("error", err.message);
      res.redirect("back");
    }
  },

  // Get all bookings
  getAllBookings: async (req, res) => {
    try {
      const bookings = await Booking.find({ user: req.user._id })
        .populate("concert")
        .sort({ bookingDate: -1 });
      res.render("user/get-all-booking", { bookings });
    } catch (err) {
      console.error("Error fetching bookings:", err);
      req.flash("error", err.message);
      res.redirect("/bookings");
    }
  },



  // Cancel a booking
  cancelBooking: async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id).populate("concert");

      if (!booking || booking.user.toString() !== req.user._id.toString()) {
        throw new Error("Booking not found");
      }

      booking.status = "cancelled";
      await booking.save();

      // Return tickets to concert availability
      const concert = booking.concert;
      concert.availableTickets += booking.tickets;
      await concert.save();

      req.flash("success", "Booking cancelled successfully");
      res.redirect("/bookings");
    } catch (err) {
      req.flash("error", err.message);
      res.redirect("/bookings");
    }
  },
};
