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
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['credit', 'debit', 'paypal', 'razorpay'],
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'failed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: {
    type: String,
    trim: true
  },
  paymentId: {
    type: String,
    trim: true
  },
  bookingDate: {
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

// Virtual for formatted booking date
bookingSchema.virtual('formattedBookingDate').get(function() {
  return this.bookingDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Ensure user can't book more tickets than available
bookingSchema.pre('save', async function(next) {
  const concert = await mongoose.model('Concert').findById(this.concert);
  if (!concert) {
    const err = new Error('Concert not found');
    err.status = 404;
    return next(err);
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);