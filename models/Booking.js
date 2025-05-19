const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  concert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concert',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tickets: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  bookedAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to handle ticket booking
bookingSchema.statics.createBooking = async function(concertId, userId, ticketCount) {
  // Check if user already has bookings for this concert
  const existingBookings = await this.find({ concert: concertId, user: userId });
  const totalTickets = existingBookings.reduce((sum, booking) => sum + booking.tickets, 0);
  
  if (totalTickets + ticketCount > 3) {
    throw new Error(`You can only book ${3 - totalTickets} more tickets for this concert`);
  }

  return this.create({
    concert: concertId,
    user: userId,
    tickets: ticketCount
  });
};

module.exports = mongoose.model('Booking', bookingSchema);