const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  concert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concert',
    required: [true, 'Concert reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  tickets: {
    type: Number,
    required: [true, 'Number of tickets is required'],
    min: [1, 'Must book at least 1 ticket'],
    max: [10, 'Cannot book more than 10 tickets at once']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto'],
    default: 'credit_card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
bookingSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Static method to handle ticket booking
bookingSchema.statics.createBooking = async function(concertId, userId, ticketCount, paymentMethod) {
  const Concert = require('./Concert');
  
  // Check concert availability
  const concert = await Concert.findById(concertId);
  if (!concert) {
    throw new Error('Concert not found');
  }
  
  if (concert.availableTickets < ticketCount) { 
    throw new Error(`Only ${concert.availableTickets} tickets available`);
  }

  // Check user booking limit (max 10 per concert)
  const existingBookings = await this.find({ 
    concert: concertId, 
    user: userId,
    status: 'confirmed'
  });
  
  const totalTickets = existingBookings.reduce((sum, booking) => sum + booking.tickets, 0);
  
  if (totalTickets + ticketCount > 3) {
    throw new Error(`You can only book ${3 - totalTickets} more tickets for this concert`);
  }

  // Create booking
  const booking = await this.create({
    concert: concertId,
    user: userId,
    tickets: ticketCount,
    paymentMethod: paymentMethod,
    paymentStatus: 'completed'
  });

  // Update concert availability
  concert.availableTickets -= ticketCount;
  await concert.save();

  return booking;
};

module.exports = mongoose.model('Booking', bookingSchema);