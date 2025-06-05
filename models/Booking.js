const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    concert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Concert",
      required: [true, "Concert ID is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    email: {
      type: String,
      required: [false, "Email is required"],
    },
    ticketCount: {
      type: Number,
      required: [true, "Number of tickets is required"],
      min: [1, "Minimum 1 ticket required"],
      max: [10, "Maximum 10 tickets allowed"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    qrCode: {
      type: String,
      default: "https://hexdocs.pm/qr_code/docs/qrcode.svg",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: ["credit_card", "paypal", "bank_transfer", "crypto"],
        message: "Invalid payment method",
      },
      default: "credit_card",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    concertDetails: {
      name: String,
      artist: String,
      date: Date,
      time: String,
      venue: String,
      image: String,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for formatted booking date
bookingSchema.virtual("formattedBookingDate").get(function () {
  return this.bookedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Update timestamp before saving
bookingSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Validate ticket availability
bookingSchema.pre("save", async function (next) {
  try {
    const concert = await mongoose.model("Concert").findById(this.concert);

    if (!concert) {
      throw new Error("Concert not found");
    }

    if (this.tickets > concert.availableTickets) {
      throw new Error(`Only ${concert.availableTickets} tickets available`);
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
